import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import fs from 'fs';

import getArticleContents from './modules/getArticleContents.js';

// Set config defaults with axios
axios.defaults.headers.common["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36";
axios.defaults.timeout = 30000;
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });

// Static and Dynamic Variables
const BASE_URL = 'https://kvkk.gov.tr';
const API_URL = `${BASE_URL}/veri-ihlali-bildirimi/?page=`; // Example: https://kvkk.gov.tr/veri-ihlali-bildirimi/?page=1
let maxPage = 1;
let currentPage = 1;
let tempData = [];
let counter = 0;

while (currentPage <= maxPage) {
    let url = `${API_URL}${currentPage}`;
    try {
        await axios.get(url)
            .then(async (response) => {
                if(response.status !== 200) {
                    console.log(`Error: ${response.status}`);
                    console.log('Response: ',response.statusText);
                    return;
                }
                const $ = cheerio.load(response.data);
                
                // Set Max Page
                if(currentPage === 1) {
                    const pagination = $('ul.pagination li.page-item a.page-link');
                    maxPage = parseInt(pagination.last().attr('href').split('=')[1]);
                    console.log(`Max Page Set: ${maxPage}`);
                }

                //console.log(`Page: ${currentPage} - Status: ${response.status}`);

                // Get Blog Data
                const blogDate = $('div.blog-post-inner p.small-text').text();
                const blogTitle = $('h3.blog-post-title').text();
                const blogUrl = `${BASE_URL}${$('div.row.justify-content-end a.arrow-link.all-items').attr('href')}`;
                const blogImage = `${BASE_URL}${$('div.blog-post-image img').attr('src')}`;
                const blogContent = await getArticleContents(blogUrl)

                tempData.push({
                    blogDate,
                    blogTitle,
                    blogUrl,
                    blogImage,
                    blogContent
                });
                counter++;
                
                // Get Grid Data
                const grids = $('div.col-lg-4.col-md-6.col-sm-12.pb-3 div.blog-grid-item.h-100.d-block');
                grids.each(async (index, row) => {
                    const gridDate = $(row).find('div.box-content-inner p.blog-grid-meta.small-text span').text();
                    const gridTitle = $(row).find('div.box-content-inner h4.blog-grid-title').text();
                    const gridUrl = `${BASE_URL}${$(row).find('div.box-content-inner p.blog-grid-meta.small-text span a').attr('href')}`;
                    const gridImage = `${BASE_URL}${$(row).find('div.box-content-inner div.blog-grid-image img').attr('src')}`;
                    const gridContent = await getArticleContents(gridUrl);

                    /*tempData = [
                        ...tempData,
                        {
                            gridDate,
                            gridTitle,
                            gridUrl,
                            gridImage,
                            gridContent
                        }
                    ]*/
                    tempData.push({
                        gridDate,
                        gridTitle,
                        gridUrl,
                        gridImage,
                        gridContent
                    });
                    counter++;
                });
            })
            .catch((error) => {
                console.log(error);
            });
            console.log(`Page: ${currentPage} - Done`);
            if(currentPage === maxPage) {
                console.log('Total Item Count:', counter);
                console.log('Writing File...');
                setTimeout(() => {
                    fs.writeFileSync('data.json', JSON.stringify(tempData), { flags: 'a', encoding: 'utf8' })
                }, 5000);
            }
        currentPage++;
    } catch (error) {
        console.log(`ERROR! Page: ${currentPage}`,error);
    }
}