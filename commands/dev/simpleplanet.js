var seedrandom = require('seedrandom');
var Jimp = require('jimp');
const Discord = require('discord.js'); // Image embed

function random_unit_vector(rng,amp) {
    let theta = rng() * 2 * Math.PI;
    let phi = Math.acos(2*rng()-1);
    let amp2 = (amp||1)*Math.sin(phi);
    return {
        x: amp2*Math.cos(theta),
        y: amp2*Math.sin(theta),
        z: (amp||1)*Math.cos(phi)
    };
}

function random_vec_grid(nodes,amp,seed) {
  let grid = [];
  for (let i = 0; i < nodes; i++) {
    let row = [];
    for (let j = 0; j < nodes; j++) {
      let col = [];
      for (let k = 0; k < nodes; k++) {
        col.push(random_unit_vector(seedrandom(`${seed}_${i},${j},${k}`),amp));
      }
      row.push(col);
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
    name: 'simpleplanet', // The name of the command
    description: 'Test the heightmap code for potential planet. Work in progress. Produces a 2D image that can be mapped onto a sphere without it being warped.', // The description of the command (for help text)
    args: false,
    perms: 'dev', //restricts to users with the "verifed" role noted at config.json
    usage: '[seed] [width/height]', // Help text to explain how to use the command (if it had any arguments)
    cooldown: 30,
    allowDM: true,
    async execute(message, args) {
      const seed = args.length > 0 ? args[0] : [...Array(10)].map(i=>(~~(Math.random()*36)).toString(36)).join('');

      const params = {
        nodes: [64,32,16,8,4],
        amps: [0.1,0.2,0.4,0.6,0.8]
      };

      let size = args.length > 1 ? Math.floor(Number(args[1])) || 600 : 600;

      size = Math.max(100,Math.min(800,size));

      let nodes = params.nodes;
      let amps = params.amps;

      const layers = nodes.length;
      const maxAmp = amps.reduce((a,b)=>a+b,0);

      let grids = [...new Array(layers)].map((a,i)=>random_vec_grid(nodes[i],amps[i],`${seed}_${i}`));

      var gradients = [...new Array(layers)].map(a=>{
        return {};
      });

      const dot_prod_grid = (layer, x, y, z, vx, vy, vz) => {
        let d_vect = {x: x - vx, y: y - vy, z: z - vz};
        let g_vect;
        if (gradients[layer][[vx,vy,vz]]){
          g_vect = gradients[layer][[vx,vy,vz]];
        } else {
          g_vect = grids[layer][vx][vy][vz];
          gradients[layer][[vx,vy,vz]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y + d_vect.z * g_vect.z;
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

      let image = new Jimp(2*size, size, function (err, img) {
        if (err) {console.error(err)};

        // interate through pizels
        for (let px = 0; px < size*2; px++) {
          for (let py = 0; py < size; py++) {
            let v = 0;
            const theta = Math.PI*px / size; // angle from x-axis in x-y plane
            const phi = Math.PI*(py / size); // angle from y-axis in y-z plane
            for (let l = 0; l < layers; l++) {
              // get radius of this node layer
              const r = (nodes[l]-1) / (2*Math.PI);
              // add r to each coordinate as the origin is at (r,r) and not (0,0);
              const x = r + r*Math.sin(phi)*Math.sin(theta);
              const y = r + r*Math.sin(phi)*Math.cos(theta);
              const z = r + r*Math.cos(phi);
              let xf = Math.floor(x);
              let yf = Math.floor(y);
              let zf = Math.floor(z);
              let tl1 = dot_prod_grid(l, x, y, z, xf, yf, zf);
              let tr1 = dot_prod_grid(l, x, y, z, xf+1, yf, zf);
              let bl1 = dot_prod_grid(l, x, y, z, xf, yf+1, zf);
              let br1 = dot_prod_grid(l, x, y, z, xf+1, yf+1, zf);
              let tl2 = dot_prod_grid(l, x, y, z, xf, yf, zf+1);
              let tr2 = dot_prod_grid(l, x, y, z, xf+1, yf, zf+1);
              let bl2 = dot_prod_grid(l, x, y, z, xf, yf+1, zf+1);
              let br2 = dot_prod_grid(l, x, y, z, xf+1, yf+1, zf+1);
              let xt1 = interpolate(x-xf, tl1, tr1);
              let xb1 = interpolate(x-xf, bl1, br1);
              let xt2 = interpolate(x-xf, tl2, tr2);
              let xb2 = interpolate(x-xf, bl2, br2);
              let ytb1 = interpolate(y-yf, xt1, xb1);
              let ytb2 = interpolate(y-yf, xt2, xb2);
              v = v + interpolate(z-zf, ytb1, ytb2);
            }
            img.setPixelColor(toColor(v), px, py);
          }
        }

        //img.dither565();
        img.getBufferAsync(Jimp.MIME_PNG).then(buffer=>{
          const attachment = new Discord.MessageAttachment(buffer, 'planetmap.png');
          const embed = new Discord.MessageEmbed()
          .setColor('#2e51a2')
          .setTitle(`The Planet of ${seed}`)
          .setDescription("You can view the map on a globe with [This Website](https://www.maptoglobe.com/).")
          .setImage('attachment://planetmap.png')
          .setFooter('A 2-dimensional representaion of a planet map.')
          .setTimestamp()
          message.channel.send({embed: embed, files: [attachment]});
        }).catch(err=>console.err(error));
      });
    },
};
