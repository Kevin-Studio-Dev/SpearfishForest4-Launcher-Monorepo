// 필요한 모듈들
const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')
const ConfigManager = require('./configmanager')
const { LoggerUtil } = require('helios-core')
const LangLoader = require('./langloader')
const DistroManager = require('./distromanager')

// 로거 초기화
const logger = LoggerUtil.getLogger('Preloader')

// 메인 프로세스와의 통신을 위한 API
contextBridge.exposeInMainWorld('launcher', {
    // 프리로더 초기화 함수
    initialize: async () => {
        logger.info('초기화 함수 시작')
        try {
            // Load ConfigManager
            logger.info('ConfigManager 로드 시작')
            await ConfigManager.load()
            logger.info('ConfigManager 로드 완료')

            // Load Strings
            logger.info('언어 설정 시작')
            LangLoader.setupLanguage()
            logger.info('언어 설정 완료')

            // 배포 데이터 로드 시도
            logger.info('배포 데이터 로드 시작')
            try {
                const distro = await DistroManager.DistroAPI.getDistribution()
                if (!distro) {
                    throw new Error('배포 데이터가 null입니다')
                }
                logger.info('배포 데이터 로드 성공:', distro)
                return distro
            } catch (err) {
                logger.error('배포 데이터 로드 중 오류 발생:', err)
                throw err
            }
        } catch (error) {
            console.error('프리로더 초기화 중 오류 발생:', error)
            throw error
        }
    },
    
    // 에러 표시 함수
    showError: (message) => {
        ipcRenderer.send('showError', message)
    }
})
