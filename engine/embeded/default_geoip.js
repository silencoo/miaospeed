// 默认 GeoIP 处理脚本
// 如果没有提供自定义脚本，miaospeed 会优先使用 MaxMind DB，如果失败才会调用这个脚本
// handler(ip) 函数接收一个 IP 地址字符串，返回 GeoInfo 对象
function parseAsn(raw) {
    if (raw === null || raw === undefined) return 0;
    if (typeof raw === 'number') return raw;
    var s = String(raw).trim();
    if (s.startsWith('AS')) {
        s = s.slice(2);
    }
    var match = s.match(/^(\d+)/);
    if (match && match[1]) {
        var n = parseInt(match[1], 10);
        return isNaN(n) ? 0 : n;
    }
    return 0;
}

function handler(ip) {
    if (!ip || typeof ip !== 'string') {
        return {};
    }

    // 使用多个 GeoIP API 作为备选，提高成功率
    var geoApis = [
        {
            url: "https://ipapi.co/" + ip + "/json/",
            parser: function(data) {
                return {
                    ip: get(data, "ip", ip),
                    country: get(data, "country_name", ""),
                    country_code: get(data, "country_code", ""),
                    countryCode: get(data, "country_code", ""),
                    city: get(data, "city", ""),
                    continentCode: get(data, "continent_code", ""),
                    organization: get(data, "org", ""),
                    isp: get(data, "org", ""),
                    asn: parseAsn(get(data, "asn", 0)),
                    asn_organization: get(data, "org", ""),
                    asnOrg: get(data, "org", ""),
                    longitude: parseFloat(get(data, "longitude", 0)) || 0,
                    latitude: parseFloat(get(data, "latitude", 0)) || 0,
                    timezone: get(data, "timezone", "")
                };
            }
        },
        {
            url: "https://ip-api.com/json/" + ip + "?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,asname,query",
            parser: function(data) {
                if (get(data, "status") === "success") {
                    return {
                        ip: get(data, "query", ip),
                        country: get(data, "country", ""),
                        country_code: get(data, "countryCode", ""),
                        countryCode: get(data, "countryCode", ""),
                        city: get(data, "city", ""),
                        continentCode: "", // ip-api.com 不提供 continent code
                        organization: get(data, "org", ""),
                        isp: get(data, "isp", ""),
                        asn: parseAsn(get(data, "as", "")),
                        asn_organization: get(data, "asname", ""),
                        asnOrg: get(data, "asname", ""),
                        longitude: parseFloat(get(data, "lon", 0)) || 0,
                        latitude: parseFloat(get(data, "lat", 0)) || 0,
                        timezone: get(data, "timezone", "")
                    };
                }
                return null;
            }
        },
        {
            url: "https://ipapi.co/" + ip + "/json/",
            parser: function(data) {
                // 备用解析器，处理不同的响应格式
                if (data && !data.error) {
                    return {
                        ip: get(data, "ip", ip),
                        country: get(data, "country_name", ""),
                        country_code: get(data, "country_code", ""),
                        countryCode: get(data, "country_code", ""),
                        city: get(data, "city", ""),
                        continentCode: get(data, "continent_code", ""),
                        organization: get(data, "org", ""),
                        isp: get(data, "org", ""),
                        asn: parseAsn(get(data, "asn", 0)),
                        asn_organization: get(data, "org", ""),
                        asnOrg: get(data, "org", ""),
                        longitude: parseFloat(get(data, "longitude", 0)) || 0,
                        latitude: parseFloat(get(data, "latitude", 0)) || 0,
                        timezone: get(data, "timezone", "")
                    };
                }
                return null;
            }
        }
    ];

    // 尝试每个 API，直到成功获取数据
    for (var i = 0; i < geoApis.length; i++) {
        try {
            var response = fetch(geoApis[i].url, {
                timeout: 5000,
                retry: 1,
                headers: {
                    "User-Agent": "MiaoSpeed/4.0"
                }
            });

            if (response && response.statusCode === 200 && response.body) {
                var data = safeParse(response.body);
                if (data) {
                    var geoInfo = geoApis[i].parser(data);
                    if (geoInfo && geoInfo.ip) {
                        return geoInfo;
                    }
                }
            }
        } catch (e) {
            // 忽略错误，继续尝试下一个 API
            continue;
        }
    }

    // 如果所有 API 都失败，返回包含 IP 的最小对象
    return {
        ip: ip,
        country: "",
        country_code: "",
        countryCode: "",
        city: "",
        continentCode: "",
        organization: "",
        isp: "",
        asn: 0,
        asn_organization: "",
        asnOrg: "",
        longitude: 0,
        latitude: 0,
        timezone: ""
    };
}
