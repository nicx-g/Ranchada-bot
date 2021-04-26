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
const distube = new DisTube(client, { searchSongs: false, emitNewSongOnly: true, leaveOnStop: false});
//Spotify Url info
const {getTracks} = require("spotify-url-info")
var isSpotifyPlaylist = false;
var isMessageSent = false;
var playListLength = '';

client.on('ready', () => {
    console.log(`tamos ready pa`)
})

client.on("message", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift();
    let comandos = [
        {
            name: `${config.prefix}p / ${config.prefix}play`,
            value: `Poné lo que se te cante. PlayLists de Spotify sólo soporta hasta 100 tracks. Ej: \`${config.prefix}p marcha peronista / link de youtube / link de Spotify\`.`
        },
        {
            name: `${config.prefix}stop`,
            value: 'Vacías la queue y se detiene la música'
        },
        {
            name: `${config.prefix}pause`,
            value: 'Pausa la música. Por alguna razón que desconozco no funciona por el momento'
        },
        {
            name: `${config.prefix}resume`,
            value: 'Despausa la música'
        },
        {
            name: `${config.prefix}autoplay`,
            value: 'Para activar/desactivar el autoplay. Cuando suene una canción podés comprobar si está prendido o apagado'
        },
        {
            name: `${config.prefix}skip / ${config.prefix}next / ${config.prefix}n`,
            value: 'Para pasar a la siguiente canción'
        },
        {
            name: `${config.prefix}queue / ${config.prefix}q`,
            value: `Te va a tirar el listado de las primeras 20 canciones que va a sonar, si querés saber las demás canciones podés colocar otro número. Ej: \`${config.prefix}queue 20\` te va a mostrar de la canción 20 hasta la 40`
        },
        {
            name: `${config.prefix}leave`,
            value: 'Para que el bot se vaya del voice, no me lo dejes solo'
        },
        {
            name: `${config.prefix}setvolume`,
            value: 'Para setear el volumen, inicialmente va a estar en 25 cuando empiece una queue. Sólo va de 0 a 100 el volumen'
        },
        {
            name: `${config.prefix}volume`,
            value: 'Para saber cuál es el volumen actual del bot aunque ya te aparezca cuando esté sonando una canción'
        },
        {
            name: `${config.prefix}shuffle`,
            value: 'Para poner el modo aleatorio'
        },
        {
            name: `${config.prefix}remove`,
            value: `Para eliminar una canción de la queue, podés borrarla mediante índice o la última canción. Para saber el índice de una canción lo podés ver con ${config.prefix}queue. Ej: \`${config.prefix}remove last / ${config.prefix}remove 5\``
        },
    ]

    const comprobarComandoCorrecto = () => {
        let esComando = false;
        let preComandosFiltrados = []
        let comandosFiltrados = []
        comandos.map(item => {
            if(item.name.split(' ').join('').includes('/')){
                preComandosFiltrados.push(item.name.split(' ').join('').split('/'))
            } else {
                preComandosFiltrados.push(item.name.split(' ').join(''))
            }
        })
        preComandosFiltrados.map(item => {
            if(Array.isArray(item) === true){
                item.map(item => comandosFiltrados.push(item))
            } else {
                comandosFiltrados.push(item)
            }
        })
        comandosFiltrados.map(item => {
            if(item == `${config.prefix}${command}`){
                esComando = true
            }
        })
        return esComando
    }
    let esComando = comprobarComandoCorrecto()
    if(esComando === false && command !== 'help') {
        let embed = new MessageEmbed()
        .setDescription(`Le pifiaste al comando padre. Poné \`${config.prefix}help\` para ver todos los comandos. Si querés usar uno y no está decile al corren`)
        .setColor('PURPLE')
        message.channel.send(embed)
    }

    if(command == 'help') {
        let embed = {
            title: 'Comandos para usar en el bot, no uses otro porque no funca',
            color: 'PURPLE',
            fields: comandos,
            footer: {text: 'No hay más'}
        }
        message.channel.send({embed})
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

    if(command == 'remove') {
        let queue = distube.getQueue(message);
        if(args[0] === 'last'){
            queue.songs.pop();
            message.react('👌')
        } else {
            queue.songs.splice(Number(args.join('')), 1)
            message.react('👌')
        }
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
        distube.setVolume(message, Number(args[0]))
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
            let songsWithNull = []
            let minimo = args.join('')
            let maximo = Number(args.join('')) + 20
            queue.songs.map((cancion, id) => {
                songsWithNull.push(id <= maximo && id >= minimo ? `\`${id < 10 ? `0${id}` : id } | ${cancion.name} | ${cancion.formattedDuration}\`` : null)
            })
            let songs = songsWithNull.filter(item => item !== null)
            let description = songs.join('\n')
            let embed = {
                color: "PURPLE",
                author: {
                    name: 'Current Queue',
                    icon_url: "https://image.flaticon.com/icons/png/512/49/49097.png"
                },
                description: songs.length === 0 ? 'No hay canciones con este rango de índices, probá con un número menor' : description,
                footer: {
                    text: `Hay ${queue.songs.length} ${queue.songs.length === 1 ? 'canción' : 'canciones'} en este momento`,
                    icon_url: null
                }
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
        let ultimosMensajesBot = [];
        queue.textChannel.messages.cache.map(item => {
            if(item.author.username == client.user.username){
                let mensajeDePlaySong = item.embeds ? item.embeds.filter(item => item.author.name === 'Está sonando') : ''
                if(mensajeDePlaySong.length !== 0){
                    ultimosMensajesBot.push(item.id)
                }
            }
        })
        if(ultimosMensajesBot.length !== 0){
            queue.textChannel.messages.fetch(ultimosMensajesBot[ultimosMensajesBot.length - 1])
            .then(message => queue.textChannel.messages.delete(message))
            .catch(error => console.log(error))
        }
        let modeAutoplay = queue.autoplay
        let fotoAutor = "https://image.flaticon.com/icons/png/512/49/49097.png"
        let embed = new MessageEmbed()
            .setAuthor('Está sonando', fotoAutor)
            .setDescription(`\`${song.name} | [${song.formattedDuration}]\``)
            .addField('Y la puso: (mentira ninguno de acá la pone)', `${song.user}`)
            .setColor('PURPLE')
            .setFooter(`Volumen ${queue.volume} | Autoplay ${modeAutoplay ? 'On' : 'Off'}`)
        queue.textChannel.send(embed)
        client.user.setActivity(song.name, {type: "LISTENING"})
        setTimeout(() => {
                client.user.lastMessage.delete()
        }, Number(`${song.duration}000`))
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
        .setDescription(`Se rompió algo, intentalo de nuevo, probá más tarde o avisale al corren\nError: \`${error}\``)
        .setColor('PURPLE')
        channel.send(embed)
    })
    .on('initQueue', queue => {
        queue.volume = 25
        queue.autoplay = "on"
    })

    client.login(config.token)