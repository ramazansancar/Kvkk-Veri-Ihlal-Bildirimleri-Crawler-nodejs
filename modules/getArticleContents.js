import axios from "axios";
import * as cheerio from "cheerio";
import https from 'https';

// Set config defaults with axios
axios.defaults.headers.common["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36";
axios.defaults.timeout = 30000;
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });

// Example: https://kvkk.gov.tr/Icerik/7549/Kamuoyu-Duyurusu-Veri-Ihlali-Bildirimi-Sahibinden-Bilgi-Teknolojileri-Paz-ve-Tic-A-S-

export default async (url) => {
    let returnData = {};
    try {
        await axios.get(url)
            .then((response) => {
                if(response.status !== 200) {
                    console.log(`Error: ${response.status}`);
                    console.log('Response: ',response.statusText);
                    return;
                }
                const $ = cheerio.load(response.data);
                //console.log('Response: ',response.status,'Content Url: ',url)
                const content = $('div.blog-post-inner div').html();
                returnData = content;
            }).catch((error) => {
                console.log(error);
            });
    } catch (error) {
        console.log(error);
    }
    return returnData;
};