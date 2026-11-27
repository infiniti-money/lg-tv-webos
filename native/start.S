.syntax unified
.thumb
.text
.global _start
.type _start,%function
.thumb_func
_start:
    bl probe_main
    /* ARM EABI exit_group (248): terminate injected worker threads too. */
    movs r7,#248
    svc #0
    udf #0
.size _start, .-_start
.section .note.GNU-stack,"",%progbits
