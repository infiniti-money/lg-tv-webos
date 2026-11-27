.syntax unified
.thumb
.text
.global _start
.type _start,%function
.thumb_func
_start:
    bl probe_main
    movs r7,#1
    svc #0
.size _start, .-_start
.section .note.GNU-stack,"",%progbits
