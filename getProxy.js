var request = require("request");
var cheerio = require("cheerio");
var fs = require("fs");

var proxys = [];  //保存从网站上获取到的代理
var useful = [];  //保存检查过有效性的代理
var ok=0;

/**
 * 获取www.xicidaili.com提供的免费代理
 */
function getXici() {
    url = "http://www.xicidaili.com/nn";  // 国内高匿代理
    var oneNum=0;
    request ({
        url: url,
        method: "GET",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'
        } //给个浏览器头，不然网站拒绝访问
    }, function(error, response, body) {
        if(!error) {
            var $ = cheerio.load(body);
            var trs = $("#ip_list tr");
            for(var i=1;i<trs.length;i++) {
                var proxy = {};
                tr = trs.eq(i);
                tds = tr.children("td");
                proxy['ip'] = tds.eq(1).text();
                proxy['port'] = tds.eq(2).text();
                var speed = tds.eq(6).children("div").attr("title");
                speed = speed.substring(0, speed.length-1);
                var connectTime = tds.eq(7).children("div").attr("title");
                connectTime = connectTime.substring(0, connectTime.length-1);
                if(speed <= 5 && connectTime <= 1) { //用速度和连接时间筛选一轮
                    proxys.push(proxy);
                    oneNum++;
                }
            }
        }
        console.log("xici第一轮存活",oneNum);
        ok++;
        if(ok==2)check();
    });
}
function getIP181() {
    url = "http://www.ip181.com/";
    var oneNum=0;
    request ({
        url: url,
        method: "GET",
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'
        } //给个浏览器头，不然网站拒绝访问
    }, function(error, response, body) {
        if(!error) {
            var $ = cheerio.load(body);
            var trs = $("table tr");
            for(var i=1;i<trs.length;i++) {
                var proxy = {};
                tr = trs.eq(i);
                tds = tr.children("td");
                proxy['ip'] = tds.eq(0).text();
                proxy['port'] = tds.eq(1).text();
                var speed = tds.eq(4).text().substr(0,4);
                if(speed <= 5) { //用速度和连接时间筛选一轮
                    proxys.push(proxy);
                    oneNum++;
                }
            }
        }
        console.log("ip181第一轮存活",oneNum);
        ok++;
        if(ok==2)check(); 
    });
}

/**
 * 过滤无效的代理
 */
function check() {
    //尝试请求百度的静态资源公共库中的jquery文件
    var url = "http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js";
    var flag = proxys.length;  //检查是否所有异步函数都执行完的标志量
    for(var i=0;i<proxys.length;i++) {
        var proxy = proxys[i];
        request({
            url: url,
            proxy: "http://" + proxy['ip'] + ":" + proxy['port'],
            method: 'GET',
            timeout: 20000  //20s没有返回则视为代理不行
        }, function (error, response, body) {
            if(!error) {
                if (response.statusCode == 200) {
                    //这里因为nodejs的异步特性，不能push(proxy),那样会存的都是最后一个
                    useful.push(response.request['proxy']['href']);
                    console.log(response.request['proxy']['href'], "useful!");
                } else {
                   // console.log(response.request['proxy']['href'], "failed!");
                }
            } else {
               // console.log("One proxy failed!");
            }
            flag--;
            if (flag == 0) {
                console.log("共获取"+useful.length+"个可用代理IP")
                saveProxys();
            }
        });
    }
}

/**
 * 把获取到的有用的代理保存成json文件，以便在别处使用
 */
function saveProxys() {
    fs.writeFileSync("proxys.json", JSON.stringify(useful));
    console.log("保存至当前文件夹下proxys.json文件!");
}
function main(){
	getIP181();  
	getXici();
}
main();
module.exports.getProxy = function () {
	main();
	return JSON.stringify(useful);
}
