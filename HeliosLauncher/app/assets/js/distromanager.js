const { DistributionAPI } = require('helios-core/common')

const ConfigManager = require('./configmanager')

exports.REMOTE_DISTRO_URL_LATEST = 'https://publish.spearforest.spearfish.mfhz.me/latest/distribution.json'
exports.REMOTE_DISTRO_URL_PRERELEASE = 'https://publish.spearforest.spearfish.mfhz.me/prerelease/distribution.json'

exports.DistroAPI = null

exports.loadDistroAPI = function() {
    const distroURL = ConfigManager.getAllowPrerelease() ? exports.REMOTE_DISTRO_URL_PRERELEASE : exports.REMOTE_DISTRO_URL_LATEST
    const api = new DistributionAPI(
        ConfigManager.getLauncherDirectory(),
        null, // preloader에서 강제로 주입됩니다.
        null, // preloader에서 강제로 주입됩니다.
        distroURL,
        false
    )
    exports.DistroAPI = api
}