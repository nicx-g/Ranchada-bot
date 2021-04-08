require('dotenv').config();
const {Client, MessageEmbed} = require('discord.js'),
    DisTube = require('distube'),
    client = new Client(),
    config = {
        prefix: "-",
        token: process.env.DISCORD_TOKEN
    };
    
client.options.http.api = "https://discord.com/api"
const distube = new DisTube(client, { searchSongs: false, emitNewSongOnly: true, leaveOnStop: false });

client.on('ready', () => {
    console.log('tamos ready pa')
})

client.on("message", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift();

    if(command == 'play' || command == 'p') {
        distube.play(message, args.join(" "))
    }

    if (command == "stop") {
        distube.stop(message);
        message.channel.send('Se paró toda la música')
    }

    if(command == 'pause') {
        distube.pause(message);
        message.channel.send('Pausaste la canción')
    }

    if(command == 'resume') {
        distube.resume(message)
        message.channel.send('Pusiste de nuevo la musica')
    }

    if (command == "autoplay") {
        let mode = distube.toggleAutoplay(message);
        message.channel.send("Set autoplay mode to `" + (mode ? "On" : "Off") + "`");
    }

    if(command == 'skip' || command == 'next' || command == 'n') {
        distube.skip(message);
    }

    if(command == 'roja') {
        message.channel.send('@Eloobosted#0236 dale pibe')
    }

    if (command == "queue") {
        let queue = distube.getQueue(message);
        if(queue) {
            // let embed = {
            //     color: "PURPLE",
            //     author: {
            //         name: 'Curren Queue',
            //         icon_url: "https://image.flaticon.com/icons/png/512/49/49097.png"
            //     },
            //     fields:[
            //         {
            //             name: `**1.** ${queue.songs[1].name} `,
            //             value: queue.songs[1].url
            //         }
            //     ]
        
            // }
            message.channel.send('Current queue:\n' + queue.songs.map((song, id) =>
                `**${id+1}**. [${song.name}] - \`${song.formattedDuration}\` \n (${song.url})`
            ).join("\n"));
        } else{
            message.channel.send('no hay canciones')
        }
    }
})  

distube
    .on('playSong', (message, queue, song) => {
        let urlAvatar = message.author.avatarURL()
        let embed = new MessageEmbed()
            .setAuthor(message.author.tag, urlAvatar)
            .addField('Está sonando', `\`${song.name} - [${song.formattedDuration}]\``)
            .addField('Y la puso: (mentira ninguno de acá la pone)', `${song.user}`)
            .setColor('PURPLE')
        message.channel.send(embed)
        client.user.setActivity(song.name, {type: "LISTENING"})
    })
    .on('addSong', (message, queue, song) => {
        let urlAvatar = message.author.avatarURL()
        let embed = new MessageEmbed()
            .setAuthor(message.author.tag, urlAvatar)
            .addField('Se agregó', `\`${song.name} - [${song.formattedDuration}]\``)
            .addField('Y la puso: (mentira ninguno de acá la pone)', `${song.user}`)
            .setColor('PURPLE')
        message.channel.send(embed)
    })

    client.login(config.token)