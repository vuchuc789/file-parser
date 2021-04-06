# API

- ``` npm start ``` - để run server ở port 3000
##### POST
lấy data của 1 file
> /file-feature
#
|Params|Required|Description|
|:---:|:---:|:---|
|```uri```|true|đường dẫn http, https đến file hoặc s3 endpoint|
|```accessKeyId```|false|s3|
|```secretAccessKey```|false|s3|
|```bucket```|false|s3|
|```fileName```|false|tên file khi sử dụng s3, tương ứng với key|

##### POST
lấy toàn bộ data của 1 bucket
> /s3-file-feature
#
|Params|Required|Description|
|:---:|:---:|:---|
|```uri```|true|s3 endpoint|
|```accessKeyId```|true||
|```secretAccessKey```|true||
|```bucket```|true|tên bucket|

# Docker

- ``` npm run docker-build ``` - để build image
- ``` npm run docker-start ``` - để run container chạy ở port 3000
- ``` npm run docker-sh ``` - để truy cập /bin/sh của container

