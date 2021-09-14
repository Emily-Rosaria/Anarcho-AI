var seedrandom = require('seedrandom');
var Jimp = require('jimp');
const Discord = require('discord.js'); // Image embed
const config = require('./../../config.json'); // load bot config

function random_unit_vector(rng,amp) {
    let theta = rng() * 2 * Math.PI;
    return {
        x: (amp||1)*Math.cos(theta),
        y: (amp||1)*Math.sin(theta)
    };
}

function random_vec_grid(nodes,amp,seed,offsets) {
  let grid = [];
  for (let i = 0; i < nodes; i++) {
    let row = [];
    for (let j = 0; j < nodes; j++) {
      row.push(random_unit_vector(seedrandom(`${seed}_${i+offsets[0]*(nodes-1)},${j+offsets[1]*(nodes-1)}`),amp));
    }
    grid.push(row);
  }
  return grid;
}

function smoothstep(x) {
    return 6*x**5 - 15*x**4 + 10*x**3;
}

function interpolate(x, a, b) {
    return a + smoothstep(x) * (b-a);
}

function pickHex(color1, color2, weight) {
    var p = 1-Math.min(Math.max(weight,0),1);
    var w = p * 2 - 1;
    var w1 = (w/1+1) / 2;
    var w2 = 1 - w1;
    var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
        Math.round(color1[1] * w1 + color2[1] * w2),
        Math.round(color1[2] * w1 + color2[2] * w2)];
    return rgb;
}

module.exports = {
    name: 'heightmap', // The name of the command
    description: 'Test the heightmap code for potential worldgen. Write array arguments in the format of `[a,b,c,...]`. An offset of [0,1] generates a map that\'s "above" the default map, while [1,0] generates one to the "right". Currently, only integer offsets are supported. A good example node and amplitude combination is `[32,16,6,4]` and `[0.2,0.3,0.7,0.8]`.', // The description of the command (for help text)
    args: 1, // Specified that this command doesn't need any data other than the command
    perms: 'user', //restricts to users with the "verifed" role noted at config.json
    usage: '<seed> [width/height] [nodes|node-array] [amplitude-array] [offset-array]', // Help text to explain how to use the command (if it had any arguments)
    cooldown: 15,
    group: 'maps',
    allowDM: true,
    async execute(message, args) {
      const seed = args[0];

      let size = args.length > 1 ? Math.floor(Number(args[1])) || 600 : 600;

      if (config.perms.dev != message.author.id) {
        size = Math.min(size,800);
      } else {
        size = Math.min(size,2048);
      }
      size = Math.max(size,64);

      let nodes = [8];
      let amps = [1];

      let offsets = [0,0];

      if (args.length > 2) {
        const temp_nodes = args.slice(2).join(' ').match(/^(\[ ?\d[ \d,.;:]*\]|[\d.]+)/g);
        if (temp_nodes && temp_nodes.length > 0) {
          nodes = temp_nodes[0].replace(/[\[\]]/g,"").trim().split(/[,;: ]+/g).map(n=>Math.floor(Math.min(64,Math.max(2,Math.abs(Number(n))))));
        }
        if (nodes.length > 1) {
          const temp_amps = args.slice(2).join(' ').slice(temp_nodes[0].length).trim().match(/(\[ ?[\d.][ \d,.;:\-]*\])/g);
          if (temp_amps && temp_amps.length > 0) {
            amps = temp_amps[0].replace(/[\[\]]/g,"").trim().split(/[,;: ]+/g).map(a=>Math.abs(Number(a))).filter(a=>!isNaN(a));
            if (temp_amps.length > 1) {
              offsets = temp_amps[1].replace(/[\[\]]/g,"").trim().split(/[,;: ]+/g).map(a=>Math.floor(Number(a))).filter(a=>!isNaN(a));
              if (offsets.length > 2) {
                offsets = offsets.slice(0,2);
              } else if (offsets.length < 2) {
                offsets = offsets.concat([...new Array(2-offsets.length)].map(a=>0));
              }
              offsets[1] = -offsets[1]; // make the positive y axis go "up" instead of down
            }
          }
          if (nodes.length > amps.length) {
            amps = amps.concat([...new Array(amps.length-nodes.length)].map(a=>1));
          } else if (amps.length > nodes.length) {
            amps = amps.slice(0,nodes.length);
          }
        }
      }

      const layers = nodes.length;
      const maxAmp = amps.reduce((a,b)=>a+b,0);

      let grids = [...new Array(layers)].map((a,i)=>random_vec_grid(nodes[i],amps[i],`${seed}_${i}`,offsets));

      var gradients = [...new Array(layers)].map(a=>{
        return {};
      });

      const dot_prod_grid = (layer, x, y, vx, vy) => {
        let d_vect = {x: x - vx, y: y - vy};
        let g_vect;
        if (gradients[layer][[vx,vy]]){
          g_vect = gradients[layer][[vx,vy]];
        } else {
          g_vect = grids[layer][vx][vy];
          gradients[layer][[vx, vy]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
      }

      const toColor = (num) => {
        const a = 255;
        const unitNum = num/maxAmp;
        let hex;
        if (unitNum<-0.1) {
          hex = pickHex([39,54,145], [70,162,232], (unitNum+1)/0.9);
        } else if (unitNum<-0.05) {
          hex = pickHex([70,162,232], [35,235,232], (unitNum+0.1)/0.05);
        } else if (unitNum<0) {
          hex = pickHex([255,246,74], [255,237,74], (unitNum+0.05)/0.05);
        } else if (unitNum<0.05) {
          hex = pickHex([201,255,74], [173, 237, 24], unitNum/0.05);
        } else if (unitNum<0.8) {
          hex = pickHex([173,237,24], [27,209,54], (unitNum-0.05)/0.75);
        } else {
          hex = pickHex([27,209,54], [143,128,87], (unitNum-0.85)/0.15);
        }
        //hex=hex.map(h=>h-(h%8));
        return Jimp.rgbaToInt(hex[0], hex[1], hex[2], a);
      }

      const inc = (nodes-1)/size;

      let image = new Jimp(size, size, function (err, img) {
        if (err) {console.error(err)};

        for (let px = 0; px < size; px++) {
          for (let py = 0; py < size; py++) {
            let v = 0;
            for (let l = 0; l < layers; l++) {
              const x = px*(nodes[l]-1)/size;
              const y = py*(nodes[l]-1)/size;
              let xf = Math.floor(x);
              let yf = Math.floor(y);
              let tl = dot_prod_grid(l, x, y, xf, yf);
              let tr = dot_prod_grid(l, x, y, xf+1, yf);
              let bl = dot_prod_grid(l, x, y, xf,   yf+1);
              let br = dot_prod_grid(l, x, y, xf+1, yf+1);
              let xt = interpolate(x-xf, tl, tr);
              let xb = interpolate(x-xf, bl, br);
              v = v + interpolate(y-yf, xt, xb);
            }
            img.setPixelColor(toColor(v), px, py);
          }
        }

        img.dither565();
        img.getBufferAsync(Jimp.MIME_PNG).then(buffer=>{
          const attachment = new Discord.MessageAttachment(buffer, 'heightmap.png');
          const embed = new Discord.MessageEmbed()
          .setColor('#2e51a2')
          .setTitle(`Map of ${seed}`)
          .setImage('attachment://heightmap.png')
          .setFooter(`x: ${offsets[0]}, y: ${-offsets[1]}, layers: ${layers}`)
          .setTimestamp()
          message.channel.send({embeds: [embed], files: [attachment]});
        }).catch(err=>console.err(error));
      });
    },
};
