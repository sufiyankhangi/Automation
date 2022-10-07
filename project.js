// npm install minimist
// npm install puppeteer

// node project.js --url='https://www.hackerrank.com' --config='config.json'

let minimist = require('minimist'); // taking arguments
let puppeteer = require('puppeteer');// automation package
let fs = require('fs');// file system manager
const { exit } = require('process');
let args = minimist(process.argv);

// reading config file which have credentials
let configjson = fs.readFileSync(args.config,'utf-8');
let config = JSON.parse(configjson);

async function run(){
    let browser = await puppeteer.launch({
        defaultViewport:null,
        args:[
            "--start-maximized"
        ],
        headless:false,
        slowMo:50
    })

    // getting a tab
    let pages = await browser.pages();
    let page = pages[0];
    await page.goto(args.url);

    // first wait for selectors then overwrite to it.

    // click on login 
    await page.waitForSelector("a[data-event-action='Login']");
    page.click("a[data-event-action='Login']");

    // click on 2nd login
    await page.waitForSelector("a[href='https://www.hackerrank.com/login']")
    page.click("a[href='https://www.hackerrank.com/login']")

    // filling the form with help of config file
    await page.waitForSelector("input[name='username']")
    await page.type("input[name='username']",config.userid,{delay:20})

    await page.waitForSelector("input[name='password']");
    await page.type("input[name='password']",config.password,{delay:30});

    await page.waitForSelector("button[data-analytics='LoginPassword']");
    page.click("button[data-analytics='LoginPassword']");

    // now we are in the page of site
    await page.waitForSelector("a[data-analytics='NavBarContests']");
    page.click("a[data-analytics='NavBarContests']");

    await page.waitForSelector("a[href='/administration/contests/']");
    page.click("a[href='/administration/contests/']");

    // wait for last page link
    await page.waitForSelector("a[data-attr1='Last']");
    let numpages = await page.$eval("a[data-attr1='Last']",function(atag){
        let np = parseInt(atag.getAttribute('data-page'));
        return np;
    })
    // loop for pages
    for(let i=0;i<numpages;i++){
        await handlepage(browser,page);
        console.log("page "+ i);
    }

    async function handlepage(browser,page){
        // do work for 1 page
        await page.waitForSelector("a.backbone.block-center");
        let ourls = await page.$$eval("a.backbone.block-center",function(atags){
            let iurls = [];
            for(let i=0;i<atags.length;i++){
                let url = atags[i].getAttribute("href");
                iurls.push(url);
            }
            return iurls;
        });
        console.log(ourls);
        for(let i=0;i<ourls.length;i++){
            await handlecontest(browser,page,ourls[i]);
        }
        await page.waitForSelector("a[data-attr1='Right']");
        await page.click("a[data-attr1='Right']");
        await page.waitForSelector("a.backbone.block-center");

       
    }
    async function handlecontest(browser,page,ourls){
        let npage = await browser.newPage();
        await npage.goto(args.url + ourls);

        await npage.waitForSelector("li[data-tab='moderators']");
        npage.click("li[data-tab='moderators']");

        await npage.waitForSelector("input#moderator");
        await npage.type("input#moderator",config.moderator,{delay:20});

        await npage.keyboard.press("Enter");
        await npage.close();
    }

    
    console.log("Run Successfully");
    await page.close();
    exit(1);
}
run();
