ffmpeg -i logo.png -vf scale=32:32:force_original_aspect_ratio=decrease,pad=32:32:(ow-iw)/2:(oh-ih)/2:color=0x00000000 -sws_flags lanczos favicon32.png
