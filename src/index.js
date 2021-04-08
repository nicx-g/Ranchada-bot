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

    if(command == 'help') {
        let embed = new MessageEmbed()
        .setTitle('Comandos para usar en el bot, no pruebes otro porque no funca')
        .setColor('PURPLE')
        .addField('-p / -play', 'Poné lo que se te cante, por ahora sólo soporta links de youtube y búsquedas a mano. Ej: -p marcha peronista. Con spotify no funca, por ahora')
        .addField('-stop', 'Limpia la queue, es decir, se vacían todas las canciones, no reproduce nada')
        .addField('-pause', 'Pausa la música')
        .addField('-resume', 'Reanuda la música')
        .addField('-autoplay', 'Esto es para desactivar/activar el autoplay')
        .addField('-skip / -next / -n', 'Va a saltear a la siguiente canción')
        .addField('-queue', 'Te va a tirar el listado de canciones que va a sonar')
        .addField('-leave', 'Para que el bot se vaya del voice, no me lo dejes solo')
        .addField('-setVolume', 'Para setear el volumen, inicialmente va a estar en 25 cuando empiece una queue. Sólo va de 0 a 100 el volumen')
        .addField('-volume', 'Para saber cuál es el volumen actual del bot')
        .setFooter('No hay más')
        message.channel.send(embed)
    }
    
    if(command == 'play' || command == 'p') {
        distube.play(message, args.join(" "))
    }

    if (command == "stop") {
        distube.stop(message);
        let embed = new MessageEmbed()
        .setDescription('Se vació la queue')
        message.channel.send(embed)
    }

    if(command == 'pause') {
        distube.pause(message);
        let embed = new MessageEmbed()
        .setDescription('Se pausó la música')
        message.channel.send(embed)
    }

    if(command == 'resume') {
        distube.resume(message)
        let embed = new MessageEmbed()
        .setDescription('La música se reanudó')
        message.channel.send(embed)
    }

    if (command == "autoplay") {
        let mode = distube.toggleAutoplay(message);
        message.channel.send("Set autoplay mode to `" + (mode ? "On" : "Off") + "`");
    }

    if(command == 'skip' || command == 'next' || command == 'n') {
        distube.skip(message);
        message.react('522626958899675146')
    }

    if(command == 'leave'){
        const leave = await message.member.voice.channel.leave()
        message.react('👋')
    }

    if(command == 'setVolume'){
        distube.setVolume(message, args[0])
    }
    
    if(command == 'volume'){
        let queue = distube.getQueue(message)
        if(queue){
            let embed = new MessageEmbed()
            .setDescription(`El volumen es ${queue.volume}`)
            .setColor('PURPLE')
            message.channel.send(embed)
        }
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
                `${id < 50 ? `**${id+1}**. [${song.name}] - \`${song.formattedDuration}\` \n (${song.url})` : ''}`
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
    .on('initQueue', queue => {
        queue.volume = 25
        queue.autoplay = "on"
    })

    client.login(config.token)