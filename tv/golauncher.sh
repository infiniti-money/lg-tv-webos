#!/bin/sh
# LG Input Hook Execute action: safely prefer Infiniti TV Home on the Home button.
# Never delete or modify LG Home. If launcher is missing, return to LG Home.
APP_ID=com.infinitimoney.tvhome
DATA=/home/root/lg-tv-vibehack
if [ -f "$DATA/home-enabled" ] &&
   { [ -d "/media/developer/apps/usr/palm/applications/$APP_ID" ] ||
     [ -d "/media/cryptofs/apps/usr/palm/applications/$APP_ID" ]; }; then
  /usr/bin/luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.infinitimoney.tvhome"}' >/dev/null 2>&1 && exit 0
fi
/usr/bin/luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.webos.app.home"}' >/dev/null 2>&1
