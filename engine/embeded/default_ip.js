// 默认 IP 解析脚本
// ip_resolve_default() 函数用于获取代理的出口 IP 地址
// 返回一个 IP 地址数组（字符串数组）
function ip_resolve_default() {
    // 使用多个 IP 查询服务作为备选，提高成功率
    var ipServices = [
        "https://api.ipify.org?format=json",
        "https://api.ip.sb/ip",
        "https://ifconfig.me/ip",
        "https://icanhazip.com",
        "https://api-ipv4.ip.sb/ip"
    ];

    var ips = [];
    var ipSet = new Set(); // 用于去重

    // 尝试从每个服务获取 IP
    for (var i = 0; i < ipServices.length && ips.length < 2; i++) {
        try {
            var response = fetch(ipServices[i], {
                timeout: 5000,
                retry: 1
            });

            if (response && response.statusCode === 200 && response.body) {
                var body = response.body.trim();

                // 处理 JSON 格式的响应（如 ipify.org）
                if (body.startsWith("{") && body.includes("ip")) {
                    var data = safeParse(body);
                    if (data && data.ip) {
                        var ip = String(data.ip).trim();
                        if (ip && !ipSet.has(ip)) {
                            ipSet.add(ip);
                            ips.push(ip);
                        }
                    }
                } else {
                    // 处理纯文本格式的响应（如 ip.sb, ifconfig.me）
                    var ip = body.trim();
                    // 简单的 IP 格式验证（IPv4 或 IPv6）
                    if (ip && (ip.match(/^[\d.]+$/) || ip.includes(":")) && !ipSet.has(ip)) {
                        ipSet.add(ip);
                        ips.push(ip);
                    }
                }
            }
        } catch (e) {
            // 忽略错误，继续尝试下一个服务
            continue;
        }
    }

    // 如果所有服务都失败，返回空数组
    return ips;
}
