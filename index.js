const serverList = require("./server_lists.json")

const schedule = require("node-schedule")

/**
 * 
 * @param {String} server 
 * @param {Number} time_period 
 * @param {Number} sales_amount 
 * @param {Number} average_price 
 * @param {Array} filters 
 * @param {String} sort_by 
 */
const requestData = (server = process.env.default_server, time_period = process.env.default_time_period, sales_amount = process.env.default_sales_amount, average_price = process.env.default_average_price, filters = process.env.default_filters, sort_by = process.env.default_sort_by) => new Promise(async (resolve, reject) => {
  if (!serverList.list.includes(server)) {
    reject({ "error": "Serveur non-existant" })
  }
  let response = await fetch('https://docs.saddlebagexchange.com/api/ffxivmarketshare', {
    method: 'post',
    body: JSON.stringify({ server, time_period, sales_amount, average_price, filters, sort_by }),
    headers: { 'Content-Type': 'application/json' }
  });
  let data = await response.json();

  resolve(data)
})





const DISCORD = require('discord.js');
const config = require('./config.json');

const discordClient = new DISCORD.Client({ intents: [DISCORD.GatewayIntentBits.Guilds] });


discordClient.once(DISCORD.Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  // discordClient.channels.fetch("490203196728410118", {force:true}).then(channel => channel.bulkDelete(69))
});

discordClient.login(process.env.DISCORD_TOKEN);


let sendData = function (channelID = process.env.default_channel, server = process.env.default_server, time_period = process.env.default_time_period, sales_amount = process.env.default_sales_amount, average_price = process.env.default_average_price, filters = process.env.default_filters, sort_by = process.env.default_sort_by, maxItem = process.env.default_max_item) {
  let date = new Date()
  requestData(server, time_period, sales_amount, average_price, filters, sort_by).then(data => {
    data = data.data

    let embeds = []
    discordClient.channels.fetch(channelID, { force: true }).then(channel => {
      channel.send({
        "flags": 32768,
        "components": [
          {
            "type": 10,  // ComponentType.TEXT_DISPLAY
            "content": `Info du marché de FFXIV du \`${date.getDay()}/${date.getMonth()}/${date.getFullYear()}\`\nPériode : \`${time_period}h\``
          },
          {
            "type": 14,  // ComponentType.SEPARATOR
            "divider": true,
            "spacing": 2
          },
          {
            "type": 10,  // ComponentType.TEXT_DISPLAY
            "content": `Serveur sélectionné : \`${server}\` | Nombre d'items à afficher : \`${maxItem}\` (sur \`${data?.length || 0}\` reçus)`
          }
        ]
      })
        
      let footer = {
            "text": `server ${server}, time_period ${time_period}, sales_amount ${sales_amount}, average_price ${average_price}, filters ${filters}, sort_by ${sort_by}`
          }
      let author = {
            "name": `${server}`,
            "icon_url": `https://arrstatus.com/images/${server}.webp`
          }
      if (data) {
        for (item in data) {
          if (item == maxItem) break;

          
          
          embeds.push({
            "title": `${data[item].name} - Etat : \`${data[item].state.replace("increasing", "En Augmentation").replace("spiking", "Augmentation rapide").replace("decreasing", "En Baisse").replace("stable", "Stable").replace("crashing", "Chute libre")}\``,
            "url": `${data[item].url}`,

            "thumbnail": {
              "url": `https://universalis-ffxiv.github.io/universalis-assets/icon2x/${data[item].itemID}.png`
            },
            "color": data[item].state == "spiking" ? 2123412 : data[item].state == "increasing" ? 2067276 : data[item].state == "stable" ? 9936031 : data[item].state == "decreasing" ? 11027200 : data[item].state == "crashing" ? 10038562 : 15277667,
            "fields": [
              {
                "name": "\u200b",
                "value": `Valeur Totale des ventes sur 7 jours: \`${data[item].marketValue}\` gils`,
                "inline": false
              }, {
                "name": "Prix",
                "value": `Prix moyen : \`${data[item].avg}\`\nPrix Median : \`${data[item].median}\`\nPrix Minimum à l'HdV : \`${data[item].minPrice}\` `,
                "inline": true
              }, {
                "name": "Infos Annexes",
                "value": `Quantitée Vendue : \`${data[item].quantitySold}\`\nNbre de transactions: \`${data[item].purchaseAmount}\`\nVariation du prix: \`${data[item].percentChange}\`% ${data[item].percentChange <= 0 ? "🔽" : data[item].percentChange <= 99 ? `🔼` : `⏫`}`,
                "inline": true
              }
            ],
            author, footer
          })
        }
      } else {
        embeds.push({
          "title": `Aucun changement pour ${server}`,
          "color": server == "Lich" ? 5763719 : server == "Raiden" ? 15844367 : 10038562,
          author, footer
        })
      }

      channel.send({
        embeds
      })
    })
  })
}

schedule.scheduleJob(process.env.default_schedule, () => {
  sendData("490203196728410118", "Lich")
  sendData("490203196728410118", "Raiden")
})

discordClient.once("ready", () => {
  sendData("490203196728410118", "Lich")
  sendData("490203196728410118", "Raiden")
})




//   avg: Average sale price
// marketValue: Current market value
// median: Median sale price
// purchaseAmount: Total number of purchases
// quantitySold: Total quantity of items sold
// percentChange: Percentage price change
