const { deleteFile } = require("../middleware/deleteFile");
const models = require("../models");

const all = async (req, res) => {

    try {

        const data = await models.setting.findOne();

        res.status(200).json({
            status: true,
            data
        })
    } catch (e) {
        console.log(e);

        res.status(500).json({
            status: false,
            message: "server error",
            error: e
        })
    }
}

const save = async (req, res) => {
    const {
        address,
        email,
        phone,
        facebook,
        instagram,
        twitter,
        youtube,
        linkedin,
        copyright,
        metaTitle,
        metaDescription,
        metaKeywords,
        fontFamily,
        mainColor,
        secondaryColor,
        categoryColor,
        subCategoryColor,
        subSubCategoryColor
    } = req.body;

    const imageUrl = req.logo || null;
    const placeholderImage = req.imageBase64 || null;

    try {
        const existingSetting = await models.setting.findOne();

        if (existingSetting) {
            // Update existing settings
            if (imageUrl) {
                deleteFile(existingSetting.logo);
            }
            await existingSetting.update({
                address,
                email,
                phone,
                facebook,
                instagram,
                twitter,
                youtube,
                linkedin,
                copyright,
                metaTitle,
                metaDescription,
                metaKeywords,
                fontFamily,
                mainColor,
                secondaryColor,
                categoryColor,
                subCategoryColor,
                subSubCategoryColor,
                ...(imageUrl ? { logo: imageUrl } : {}),
                ...(placeholderImage ? { placeholder: placeholderImage } : {})
            });
        } else {
            // Create new settings
            await models.setting.create({
                address,
                email,
                phone,
                facebook,
                instagram,
                twitter,
                youtube,
                linkedin,
                copyright,
                metaTitle,
                metaDescription,
                metaKeywords,
                fontFamily,
                mainColor,
                secondaryColor,
                categoryColor,
                subCategoryColor,
                subSubCategoryColor,
                logo: imageUrl,
                placeholder: placeholderImage
            });
        }

        res.status(200).json({
            status: true,
            message: "Setting saved successfully"
        });

    } catch (e) {
        if (imageUrl) {
            deleteFile(imageUrl);
        }
        res.status(500).json({
            status: false,
            message: "Server error",
            error: e
        });
    }
};

module.exports = { all, save }