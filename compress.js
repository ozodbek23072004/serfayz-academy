const sharp = require('sharp');
const fs = require('fs');

async function compressImage() {
    try {
        const inputPath = './frontend/assets/images/director.png';
        const outputPath = './frontend/assets/images/director-opt.png';
        const outputPathWebp = './frontend/assets/images/director.webp';

        await sharp(inputPath)
            .resize({ width: 800, withoutEnlargement: true }) // Resize width to 800px max
            .png({ quality: 80, compressionLevel: 9 })
            .toFile(outputPath);
            
        await sharp(inputPath)
            .resize({ width: 800, withoutEnlargement: true }) // WebP version
            .webp({ quality: 80 })
            .toFile(outputPathWebp);

        console.log('Successfully compressed images');
        console.log('PNG size:', fs.statSync(outputPath).size);
        console.log('WebP size:', fs.statSync(outputPathWebp).size);
    } catch (error) {
        console.error('Error compressing image:', error);
    }
}

compressImage();
