const { deleteFiles } = require("../middleware/deleteFile");
const models = require("../models");

const select = async (req, res) => {
    try {
        const ads = await models.ads.findOne();
        if (!ads) {
            return res.status(404).json({
                status: false,
                message: "Ads not found"
            });
        }

        const adsData = ads.toJSON();
        const serverTime = new Date().toISOString();
        adsData.serverTime = serverTime;

        res.status(200).json({
            data: adsData
        })
    } catch (e) {
        res.status(500).json({
            status: false,
            message: "server error",
            error: e
        })
    }
}

const create = async (req, res) => {
    const { title, text, startAt, endAt } = req.body;

    if (!req?.images) {
        return res.status(400).json({
            status: false,
            message: "image is required",
        });
    }

    if (!title || !text || !startAt || !endAt) {
        if (req.images?.length) deleteFiles(req.images);
        return res.status(400).json({
            status: false,
            message: "All required fields (title, text, startAt, endAt) must be provided",
        });
    }

    try {
        const existingads = await models.ads.findOne();

        const imagesArray = req.images.map((imageUrl, index) => ({
            id: index + 1,
            imageUrl,
            placeholder: req.imageBase64List[index]
        }));

        if (existingads) {
            // Update existing ads
            if (existingads.images?.length) {
                const oldImages = existingads.images.map(img => img.imageUrl);
                deleteFiles(oldImages);
            }

            await existingads.update({
                title,
                text,
                startAt,
                endAt,
                images: imagesArray
            });

            res.status(200).json({
                status: true,
                message: "ads updated successfully"
            })
        } else {
            // Create new ads
            await models.ads.create({
                title,
                text,
                startAt,
                endAt,
                images: imagesArray
            });

            res.status(200).json({
                status: true,
                message: "ads created successfully"
            })
        }


    } catch (e) {
        if (req.images?.length) deleteFiles(req.images);
        res.status(500).json({
            message: "server error",
            error: e,
        })
    }
}

const destroy = async (req, res) => {

    try {
        const ads = await models.ads.findOne()

        if (!ads) {
            return res.status(404).json({
                status: false,
                message: "ads is not found",
            })
        }

        const allImages = ads.images.flatMap((item) => item.imageUrl)
        if (allImages) {
            deleteFiles(allImages)
        }

        await ads.destroy()

        res.status(200).json({
            status: true,
            message: "ads deleted successfully",
        })
    } catch (e) {
        res.status(500).json({
            message: "server error",
            error: e
        })
    }

}

module.exports = { select, create, destroy }