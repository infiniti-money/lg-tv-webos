/* Toy DSOs only: no LG code, no injector, no system process. */
#include <unistd.h>
#include <dlfcn.h>
#define SAY(s) ((void)write(1,s,sizeof(s)-1))
#if defined(PROVIDER)
int lab_collision(void) { return 11; }
__attribute__((constructor)) static void init(void) { SAY("PROVIDER_INIT\n"); }
#elif defined(CONSUMER)
int lab_collision(void) { return 22; }
static int ctor_value;
__attribute__((constructor)) static void init(void) {
    ctor_value=lab_collision();
    SAY("CONSUMER_INIT\n");
}
int lab_observe(void) { return ctor_value; }
#else
int probe_main(void) {
    void *p=dlopen("./liblab-provider.so",RTLD_NOW|RTLD_GLOBAL);
    if(!p) { SAY("PROVIDER_LOAD_FAILED\n"); return 1; }
    SAY("PROVIDER_READY\n");
    void *c=dlopen("./liblab-consumer.so",RTLD_NOW|RTLD_LOCAL);
    if(!c) { SAY("CONSUMER_LOAD_FAILED\n"); return 2; }
    int (*observe)(void)=(int(*)(void))dlsym(c,"lab_observe");
    if(!observe || observe()!=11) { SAY("BINDING_UNEXPECTED\n"); return 3; }
    SAY("INTERPOSITION_OBSERVED\n");
    return 0;
}
#endif
