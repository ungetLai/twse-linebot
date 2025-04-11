// 檔案：api/webhook.js

import { middleware, Client } from '@line/bot-sdk';
import axios from 'axios';
import { average, calcRSI, calcBollingerBands, getFlexMessage } from '../utils/indicators.js';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

const stockNameMap = {
  '星宇航空': '2646',
  '長榮航': '2618',
  '台積電': '2330',
  '鴻海': '2317',
  '聯發科': '2454'
};

export const configModule = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const query = event.message.text.trim();

        let stockId = '';
        let stockName = query;

        if (/^\d{4}$/.test(query)) {
          stockId = query;
        } else if (stockNameMap[query]) {
          stockId = stockNameMap[query];
        } else {
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '請輸入有效的台股股票名稱或四碼股票代號（例如：台積電 或 2330）'
          });
          return;
        }

        try {
          const response = await axios.get(`https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=&stockNo=${stockId}`);
          const data = response.data.data;
          const title = response.data.title || '';

          if (!data || data.length < 20) {
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: '目前無法取得足夠的技術分析資料，請稍後再試～'
            });
            return;
          }

          const closes = data.slice(-20).map(row => parseFloat(row[6].replace(/,/g, '')));
          const ma5 = average(closes.slice(-5));
          const ma20 = average(closes);
          const rsi = calcRSI(closes);
          const { upper, lower } = calcBollingerBands(closes);
          const latestClose = closes[closes.length - 1];

          // 解析 TWSE 傳回的中文名稱（格式："證券名稱 2330 台積電"）
          const match = title.match(/\d{4}\s+(.+)$/);
          const displayName = match ? `${match[1]} (${stockId})` : `${stockName} (${stockId})`;

          const flex = getFlexMessage(latestClose, ma5, ma20, rsi, upper, lower, displayName);

          await client.replyMessage(event.replyToken, flex);
        } catch (error) {
          console.error('資料擷取失敗：', error);
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '資料擷取失敗，請稍後再試～'
          });
        }
      }
    }

    res.status(200).end();
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
