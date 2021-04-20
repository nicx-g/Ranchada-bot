//ENV
require('dotenv').config();
//Discord y Distube
const {Client, MessageEmbed} = require('discord.js'),
    DisTube = require('distube'),
    client = new Client(),
    config = {
        prefix: "-",
        token: process.env.DISCORD_TOKEN
    };
//Config Distube
client.options.http.api = "https://discord.com/api"
const distube = new DisTube(client, { searchSongs: false, emitNewSongOnly: true, leaveOnStop: false, leaveOnEmpty: false });
//Spotify Url info
const {getTracks} = require("spotify-url-info")
var isSpotifyPlaylist = false;
var isMessageSent = false;
var playListLength = '';

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
        .addField('-setvolume', 'Para setear el volumen, inicialmente va a estar en 25 cuando empiece una queue. Sólo va de 0 a 100 el volumen')
        .addField('-volume', 'Para saber cuál es el volumen actual del bot')
        .addField('-shuffle', 'Para poner el modo aleatorio')
        .setFooter('No hay más')
        message.channel.send(embed)
    }
    
    if(command == 'play' || command == 'p') {
        isSpotifyPlaylist = false;
        if(args.join(' ').includes("https://open.spotify.com/playlist")){
            let dataPlayList = await getTracks(args.join(' '));
            let preCancionesYArtistas = []
            let cancionesYArtistas = []
            dataPlayList.map((canciones) => {
                preCancionesYArtistas.push({
                    nombre: canciones.name,
                    artista: canciones.artists.map((artista) => {return artista.name}).join(' j')
                })
            })
            preCancionesYArtistas.map((cancion) => {
                cancionesYArtistas.push(`${cancion.nombre} ${cancion.artista}`)
            })
            playListLength = cancionesYArtistas.length;
            isSpotifyPlaylist = true;
            cancionesYArtistas.map(item => {
                distube.play(message, item)
            })
            isMessageSent = false
        } else {
            distube.play(message, args.join(" "))
        }
    }

    if (command == "stop") {
        distube.stop(message);
        let embed = new MessageEmbed()
        .setDescription('Se vació la queue')
        .setColor('PURPLE')
        message.channel.send(embed)
    }

    if(command == 'pause') {
        distube.pause(message);
        let embed = new MessageEmbed()
        .setDescription('Se pausó la música')
        .setColor('PURPLE')
        message.channel.send(embed)
    }

    if(command == 'resume') {
        distube.resume(message)
        let embed = new MessageEmbed()
        .setDescription('La música se reanudó')
        .setColor('PURPLE')
        message.channel.send(embed)
    }

    if (command == "autoplay") {
        let mode = distube.toggleAutoplay(message);
        let embed = new MessageEmbed()
        .setDescription(`El autoplay está ${mode ? 'prendido' : 'apagado'}`)
        .setColor('PURPLE')
        message.channel.send(embed);
    }

    if(command == 'skip' || command == 'next' || command == 'n') {
        distube.skip(message);
        message.react('522626958899675146')
    }

    if(command == 'leave'){
        const leave = await message.member.voice.channel.leave()
        message.react('👋')
    }

    if(command == 'setvolume'){
        distube.setVolume(message, args[0])
        message.react('👌')
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

    if (command == 'shuffle') {
        distube.shuffle(message)
        message.react('👌')
    }
    
    if (command == "queue" || command == 'q') {
        let queue = distube.getQueue(message);
        if(queue) {
            let songs = []
            queue.songs.map((cancion, id) => {
                songs.push(`\`${id < 10 ? `0${id}` : id} | ${cancion.name} | ${cancion.formattedDuration}\``)
            })
            let description = songs.join('\n')
            let embed = {
                color: "PURPLE",
                author: {
                    name: 'Current Queue',
                    icon_url: "https://image.flaticon.com/icons/png/512/49/49097.png"
                },
                description: description
            }
            
            setTimeout(() => {
                message.channel.send({embed: embed})
            }, 1000)
            
        } else{
            let embed = new MessageEmbed()
            .setDescription('No hay canciones activas')
            .setColor('PURPLE')
            message.channel.send(embed)
        }
    }
})  

distube
    .on('playSong', (queue, song) => {
        let fotoAutor = "https://image.flaticon.com/icons/png/512/49/49097.png"
        let embed = new MessageEmbed()
            .setAuthor('Está sonando', fotoAutor)
            .setDescription(`\`${song.name} | [${song.formattedDuration}]\``)
            .addField('Y la puso: (mentira ninguno de acá la pone)', `${song.user}`)
            .setColor('PURPLE')
        queue.textChannel.send(embed)
        client.user.setActivity(song.name, {type: "LISTENING"})
    })
    .on('addSong', (queue, song) => {
        if(isSpotifyPlaylist === true && isMessageSent === false){
            isMessageSent = true;
            let embed = new MessageEmbed()
            .setDescription(`\`Se agregaron ${playListLength} canciones a la queue\` [${queue.songs[0].user}]`)
            .setColor('PURPLE')
            queue.textChannel.send(embed)
        } else if(isSpotifyPlaylist === false){
            let fotoAutor = "https://image.flaticon.com/icons/png/512/49/49097.png"
            let embed = new MessageEmbed()
                .setAuthor('Se agregó una nueva canción', fotoAutor)
                .setDescription(`\`${song.name} | [${song.formattedDuration}]\``)
                .addField('Y la puso: (mentira ninguno de acá la pone)', `${song.user}`)
                .setColor('PURPLE')
            queue.textChannel.send(embed)
        }
    })
    .on('error', (channel, error) => {
        console.log(error)
        let embed = new MessageEmbed()
        .setDescription('Se rompió algo, intentalo de nuevo, probá más tarde o avisale al corren')
        .setColor('PURPLE')
        channel.send(embed)
    })
    .on('initQueue', queue => {
        queue.volume = 25
        queue.autoplay = "on"
    })

    client.login(config.token)