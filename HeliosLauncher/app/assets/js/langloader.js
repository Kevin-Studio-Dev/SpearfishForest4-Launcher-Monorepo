const fs = require('fs-extra')
const path = require('path')
const toml = require('toml')
const merge = require('lodash.merge')

let lang

exports.loadLanguage = function(id){
    try {
        const langPath = path.join(__dirname, '..', 'lang', `${id}.toml`)
        if(fs.existsSync(langPath)) {
            lang = merge(lang || {}, toml.parse(fs.readFileSync(langPath)) || {})
        } else {
            console.error(`Language file not found: ${langPath}`)
            // 기본 언어로 fallback
            const defaultLangPath = path.join(__dirname, '..', 'lang', 'ko_KR.toml')
            if(fs.existsSync(defaultLangPath)) {
                lang = merge(lang || {}, toml.parse(fs.readFileSync(defaultLangPath)) || {})
            }
        }
    } catch(err) {
        console.error('Error loading language file:', err)
    }
}

exports.query = function(id, placeHolders){
    let query = id.split('.')
    let res = lang
    for(let q of query){
        res = res[q]
    }
    let text = res === lang ? '' : res
    if (placeHolders) {
        Object.entries(placeHolders).forEach(([key, value]) => {
            text = text.replace(`{${key}}`, value)
        })
    }
    return text
}

exports.queryJS = function(id, placeHolders){
    return exports.query(`js.${id}`, placeHolders)
}

exports.queryEJS = function(id, placeHolders){
    return exports.query(`ejs.${id}`, placeHolders)
}

exports.setupLanguage = function(){
    // Load Default Language (English)
    exports.loadLanguage('en_US')
    // Load Korean Language
    exports.loadLanguage('ko_KR')
    // Load Custom Language File for Launcher Customizer
    exports.loadLanguage('_custom')
}