# MiaoSpeed 4.3

MiaoSpeed 是一个通过 WebSocket 接收任务的网络质量测试后端。它不提供代理能力，而是通过 Vendor 适配器连接节点，执行延迟、吞吐、GeoIP、流媒体脚本等测试。

本分支使用 [Mihomo](https://github.com/MetaCubeX/mihomo) 作为 Clash 内核，以支持包括 `2022-blake3` 在内的现代协议。

## 环境要求

- Go 1.21 或更高版本
- Bash 或 PowerShell
- OpenSSL（可选，用于生成本地开发 TLS 证书）

## 构建

Linux 与 macOS：

```bash
bash ./build.sh
```

Windows PowerShell：

```powershell
.\build.ps1
```

构建结果分别位于：

- Linux/macOS：`dist/miaospeed.meta`
- Windows：`dist/miaospeed.meta.exe`

构建脚本不会修改 `go.mod` 或 `go.sum`。如果系统安装了 OpenSSL，脚本还会在 `dist/certs/` 缺少证书时生成一对开发用自签名证书；已有证书不会被覆盖。

也可以直接构建：

```bash
go build -o dist/miaospeed.meta .
```

直接构建使用源码中的公开兼容 build token，且不会生成 TLS 证书。

## Build token

MiaoSpeed 使用两类 token 对请求签名：

- 启动 token：通过服务端的 `-token` 传入，必须和客户端配置一致。
- Build token：编译进二进制，必须和客户端的 `buildtoken` 配置一致。

默认 build token 是公开兼容值，并不应被当作真正的访问凭据。私有部署可以在构建时覆盖它：

```bash
MIAOSPEED_BUILD_TOKEN='part1|part2|part3' bash ./build.sh
```

PowerShell：

```powershell
$env:MIAOSPEED_BUILD_TOKEN = 'part1|part2|part3'
.\build.ps1
```

Build token 不再通过 `utils/embeded/BUILDTOKEN.key` 存储，因而不会意外进入 Git 历史。自定义值不能包含空白字符。

## TLS 证书

TLS 私钥不会嵌入源码或二进制。启用 TLS 时必须同时指定证书和私钥：

```bash
./dist/miaospeed.meta server \
  -bind 0.0.0.0:8765 \
  -token 'change-me' \
  -mtls \
  -tls-cert ./dist/certs/miaoko.crt \
  -tls-key ./dist/certs/miaoko.key
```

`-mtls` 是为兼容已有命令保留的参数名；当前实现启用的是服务端 TLS，并不会验证客户端证书。

构建脚本支持从外部路径复制固定证书，而不是生成开发证书：

```bash
MIAOSPEED_TLS_CERT_FILE=/run/secrets/miaospeed.crt \
MIAOSPEED_TLS_KEY_FILE=/run/secrets/miaospeed.key \
bash ./build.sh
```

可以通过 `MIAOSPEED_TLS_OUTPUT_DIR` 修改证书输出目录。脚本会验证证书和私钥是否匹配，并将私钥权限设为仅当前用户可读（PowerShell 除外）。

注意：

- 自动生成的是开发用自签名证书，不能替代 miaoko 官方使用的固定证书。
- 客户端固定证书时，不要反复重新生成；应保存证书对并通过部署环境注入。
- `dist/` 和旧的嵌入式凭据路径已加入 `.gitignore`。

## 启动服务

最小示例：

```bash
./dist/miaospeed.meta server \
  -bind 0.0.0.0:8765 \
  -token 'change-me'
```

常用参数：

| 参数 | 说明 |
| --- | --- |
| `-bind` | TCP 地址或 Unix socket，例如 `0.0.0.0:8765` |
| `-token` | 客户端和服务端共享的启动 token |
| `-whitelist` | 允许的 bot ID，多个值以逗号分隔 |
| `-connthread` | 普通连接测试的并发数，默认 `64` |
| `-speedlimit` | 速度测试限速，单位 Byte/s；`0` 表示不限制 |
| `-pausesecond` | 每次速度测试后的暂停秒数 |
| `-nospeed` | 拒绝所有速度测试任务 |
| `-mmdb` | 本地 MMDB 文件列表，以逗号分隔 |
| `-verbose` | 输出详细运行日志；不会记录 token 或完整请求内容 |

查看完整参数：

```bash
./dist/miaospeed.meta server -help
```

## GeoIP 数据库

MMDB 数据库体积较大且会定期更新，因此不进入版本控制。下载后可以在启动时指定：

```bash
./dist/miaospeed.meta server \
  -bind 0.0.0.0:8765 \
  -token 'change-me' \
  -mmdb './mmdb/GeoLite2-ASN.mmdb,./mmdb/GeoLite2-City.mmdb,./mmdb/GeoLite2-Country.mmdb'
```

程序还提供 MaxMind 更新入口：

```bash
./dist/miaospeed.meta misc -maxmind-update-license 'your-license-key'
```

## 脚本测试

使用本地 Vendor 运行 JavaScript 测试：

```bash
./dist/miaospeed.meta script -file ./example.js
```

默认脚本位于 `engine/embeded/`，会在编译时嵌入程序。

## 客户端对接

对接流程如下：

1. 建立 WebSocket 连接。
2. 按 [`interfaces/api_request.go`](interfaces/api_request.go) 构造请求。
3. 清空 `Challenge` 和 `Vendor` 后序列化请求。
4. 使用启动 token 与 build token 按 [`utils/challenge.go`](utils/challenge.go) 的算法计算签名。
5. 将签名写入 `Challenge` 并发送请求。
6. 按 [`interfaces/api_response.go`](interfaces/api_response.go) 接收进度和最终结果。

客户端强制断开连接时，对应任务会被中止。

## 项目结构

- **Matrix**：单个结果字段，例如 RTT、出口 IP 或平均速度。
- **Macro**：可被多个 Matrix 复用的一次实际测试任务。
- **Vendor**：节点连接方式的适配层；MiaoSpeed 本身不提供代理服务。

## 安全说明

- 不要将启动 token、TLS 私钥或生产配置提交到 Git。
- Build token 只是签名协议的一部分，不能替代启动 token 或网络访问控制。
- 生产环境应从 secret manager 或受限文件挂载中读取 TLS 私钥。
- 如果凭据曾推送到公开仓库，仅从最新提交删除并不够，还应轮换凭据并清理历史。

## 许可证

MiaoSpeed 使用 AGPL-3.0 许可证。修改、分发或通过网络提供服务时，请遵守该许可证的相关义务。

主要依赖包括 Mihomo、goja、json-iterator、pion/stun、go-yaml 和 gorilla/websocket；各依赖分别遵循其自身许可证。
