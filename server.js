const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const Epub = require('epub-gen');

const app = express();
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/convert', async (req, res) => {
    if (!req.files || !req.files.htmlFile || !req.files.coverImage) {
        return res.status(400).send({ message: '파일을 모두 업로드 해주세요.' });
    }

    const htmlFile = req.files.htmlFile;
    const coverImage = req.files.coverImage;

    const htmlPath = path.join(__dirname, 'uploads', htmlFile.name);
    const coverPath = path.join(__dirname, 'uploads', coverImage.name);

    await htmlFile.mv(htmlPath);
    await coverImage.mv(coverPath);

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const titleMatch = htmlContent.match(/<h1>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1] : '제목 없음';

    const chapters = htmlContent.split('<hr class="sigil_split_marker" />').slice(1);
    const content = chapters.map((chapter, index) => ({
        title: `Chapter ${index + 1}`,
        data: chapter.trim(),
    }));

    const epubPath = path.join(__dirname, 'uploads', `${title}.epub`);

    try {
        await new Epub({
            title: title,
            author: '저자 이름',
            cover: coverPath,
            content: content,
        }, epubPath).promise;

        res.json({ message: 'EPUB 파일 생성 완료!', file: `/uploads/${title}.epub` });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'EPUB 파일 생성 중 오류 발생.' });
    }
});

app.listen(3000, () => {
    console.log('서버가 3000 포트에서 실행 중입니다.');
});
