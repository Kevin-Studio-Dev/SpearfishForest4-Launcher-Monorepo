const {ipcRenderer}  = require('electron')
const fs             = require('fs-extra')
const os             = require('os')
const path           = require('path')

const ConfigManager  = require('./configmanager')
const DistroManager  = require('./distromanager')
const LangLoader     = require('./langloader')
const { LoggerUtil } = require('helios-core')
// eslint-disable-next-line no-unused-vars
const { HeliosDistribution } = require('helios-core/common')

const logger = LoggerUtil.getLogger('Preloader')

logger.info('Loading..')

// ConfigManager 로드
ConfigManager.load()

// DistroAPI 로드
DistroManager.loadDistroAPI()
const DistroAPI = DistroManager.DistroAPI

// Yuck!
// TODO Fix this
DistroAPI['commonDir'] = ConfigManager.getCommonDirectory()
DistroAPI['instanceDir'] = ConfigManager.getInstanceDirectory()

// 문자열 로드
LangLoader.setupLanguage()

/**
 * 
 * @param {HeliosDistribution} data 
 */
function onDistroLoad(data){
    if(data != null){
        
        // 선택된 서버의 값이 아직 설정되지 않은 경우 이를 해결합니다.
        if(ConfigManager.getSelectedServer() == null || data.getServerById(ConfigManager.getSelectedServer()) == null){
            logger.info('기본 선택된 서버를 결정합니다..')
            ConfigManager.setSelectedServer(data.getMainServer().rawServer.id)
            ConfigManager.save()
        }
    }
    ipcRenderer.send('distributionIndexDone', data != null)
}

// 배포를 다운로드하고 캐시해야 합니다.
DistroAPI.getDistribution()
    .then(heliosDistro => {
        logger.info('배포 인덱스를 로드했습니다.')

        onDistroLoad(heliosDistro)
    })
    .catch(err => {
        logger.info('배포 인덱스의 이전 버전을 로드하지 못했습니다.')
        logger.info('응용 프로그램을 실행할 수 없습니다.')
        logger.error(err)

        onDistroLoad(null)
    })

// 이전 실행이 예상치 못하게 종료된 경우 임시 디렉토리를 정리합니다. 
fs.remove(path.join(os.tmpdir(), ConfigManager.getTempNativeFolder()), (err) => {
    if(err){
        logger.warn('네이티브 디렉토리를 정리하는 동안 오류 발생', err)
    } else {
        logger.info('네이티브 디렉토리를 정리했습니다.')
    }
})