# -*- coding: utf-8 -*-
with open('src/pages/player/index.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换默认封面图片路径为空字符串
content = content.replace("'/static/default_cover.png'", "''")

with open('src/pages/player/index.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print("替换完成！")