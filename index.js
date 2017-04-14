/**
 * Created by 虚竹 on 2016/12/23.
 */

const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

function getArticleList(url, callback) {
    request(url, function(err, response, body) {
        if(err) {
            callback(error, null);
        }

        let $ = cheerio.load(body);
        let articleList = [];

        //获取到当前页面所有的文章、标题、链接
        $('.articleList .articleCell').each(function(index, item) {
            let $this = $(this);
            let $title = $this.find('.atc_title a');
            let $time = $this.find('.atc_tm');

            articleList.push({
                title: $title.text(),
                url: $title.attr('href'),
                time: $time.text()
            })

        });

        let nextUrl = "";
        nextUrl = $(".SG_pgnext a").attr("href");
        if(nextUrl) {
            getArticleList(nextUrl, function(err, list) {
                if(err) {
                    callback(err, null);
                }
                callback(null, articleList.concat(list));
            })
        }else {
            callback(null, articleList);
        }

    });
}

//获取详情页里面的信息
function getDetailByUrl(url, callback) {
    request(url, function(err, res, body) {
        if(err) {
            callback(err, null);
            // return;
        }

        let $ = cheerio.load(body, {
            decodeEntities: false
        });
        let content = $(".articalContent").html().trim();
        callback(null, content);
    })
}

const URL = 'http://blog.sina.com.cn/s/articlelist_2391731143_0_1.html';
const templateString = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');

getArticleList(URL, function(err, data) {
    if(err) {
        throw err;
    }

    data.forEach(function(item, index) {
        let url = item.url;
        getDetailByUrl(url, function(err, data) {
            if (err) {
                throw err;
            }

            let filePath = path.join(__dirname, "./data", item.title+ '.html');

            fs.writeFile(filePath, templateString.replace('<%content%>', data), function(err) {
                if (err) {
                    throw err;
                }
                console.log(`文件:${filePath}保存成功`);
            })
        })
    })
});