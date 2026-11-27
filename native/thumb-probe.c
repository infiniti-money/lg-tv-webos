/* Isolated synthetic input process. Never opens evdev or uinput.
 * Custom startup avoids a newer __libc_start_main dependency.
 * Deliberately no LG code or binary redistributed. */
#include <stddef.h>
#include <stdint.h>
#include <unistd.h>

struct keybind { int reserved1[4]; int code; int reserved2[9]; };
struct uinput_info { int fd; struct keybind *keys; };
_Static_assert(sizeof(struct keybind)==56,"key record");
_Static_assert(offsetof(struct keybind,code)==16,"code offset");
_Static_assert(offsetof(struct uinput_info,keys)==4,"ARM32 pointer layout");

static volatile unsigned calls;
static struct keybind keys[2];
static struct uinput_info info={-1,keys};
__attribute__((noinline,visibility("default"),used))
int lginput_uinput_send_button(struct uinput_info *p,int key,int state) {
    if (key<0 || key>1) return -1;
    calls++;
    /* Unique original return; no input devices and no physical events. */
    return p->keys[key].code+state+1000;
}
static int (*volatile invoke)(struct uinput_info *,int,int)=lginput_uinput_send_button;
static void say(const char *s, unsigned n) { (void)write(1,s,n); }
#define SAY(s) say(s,sizeof(s)-1)

int probe_main(void) {
    char c;
    keys[0].code=773; keys[1].code=115;
    SAY("READY\n");
    while(read(0,&c,1)==1) {
        if(c=='q') return 0;
        if(c!='t') continue;
        unsigned before=calls;
        int a=invoke(&info,0,1);
        int b=invoke(&info,0,0);
        int d=invoke(&info,1,1);
        int e=invoke(&info,1,0);
        if(a==1774 && b==1773 && d==1116 && e==1115 && calls-before==4)
            SAY("PASS_THROUGH_OK\n");
        else if(a==0 && b==0 && d==1116 && e==1115 && calls-before==2)
            SAY("HOME_ONLY_IGNORED\n");
        else SAY("UNEXPECTED_RESULT\n");
    }
    return 0;
}
