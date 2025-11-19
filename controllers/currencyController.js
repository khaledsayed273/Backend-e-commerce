const { default: axios } = require("axios");
const models = require("../models");

const all = async (req, res) => {
    try {
        const currencies = await models.currency.findAll();
        if (!currencies) {
            return res.status(404).json({
                status: false,
                message: "currencies not found"
            });
        }

        res.status(200).json({
            data: currencies
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
    const { code, name, symbol } = req.body;

    if (!code || !name || !symbol) {
        if (req.images?.length) deleteFiles(req.images);
        return res.status(400).json({
            status: false,
            message: "All required fields (code, name, symbol) must be provided",
        });
    }

    try {
        const existingCurrency = await models.currency.findOne({ where: { code } });

        if (existingCurrency) {
            await models.currency.update({ name, symbol }, { where: { code } });
            message = "Currency updated successfully";
        } else {
            await models.currency.create({ code, name, symbol });
            message = "Currency created successfully";
        }

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${dd}`; 
        const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateString}/v1/currencies/usd.json`;
        const response = await axios.get(url);
        const rates = response.data.usd;

        const rate = rates[code.toLowerCase()];
        if (rate) {
            await models.currency.update(
                { exchange_rate: rate },
                { where: { code } }
            );
        }

        return res.status(201).json({
            status: true,
            message,
        });

    } catch (e) {
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

module.exports = { all, create, destroy }