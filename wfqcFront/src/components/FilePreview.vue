<template>
  <div class="file-preview">
    <el-dialog
      v-model="dialogVisible"
      :title="currentFile?.origin_name || '文件预览'"
      width="80%"
      :fullscreen="isFullscreen"
      destroy-on-close
    >
      <template #header>
        <div class="dialog-header">
          <span>{{ currentFile?.origin_name || '文件预览' }}</span>
          <div class="header-actions">
            <el-button
              v-if="isImage || isVideo"
              type="primary"
              link
              @click="toggleFullscreen"
            >
              <el-icon><full-screen v-if="!isFullscreen" /><aim v-else /></el-icon>
              {{ isFullscreen ? '退出全屏' : '全屏' }}
            </el-button>
            <el-button type="primary" link @click="downloadFile">
              <el-icon><download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
      </template>

      <div class="preview-content">
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading" :size="40"><loading /></el-icon>
          <p>加载中...</p>
        </div>

        <div v-else-if="isImage" class="image-preview">
          <img :src="currentFile?.oss_url" :alt="currentFile?.origin_name" />
        </div>

        <div v-else-if="isVideo" class="video-preview">
          <video
            :src="currentFile?.oss_url"
            controls
            :autoplay="true"
          >
            您的浏览器不支持视频播放
          </video>
        </div>

        <div v-else-if="isPdf" class="pdf-preview">
          <iframe
            :src="currentFile?.oss_url"
            style="width: 100%; height: 600px; border: none"
          ></iframe>
        </div>

        <div v-else class="other-preview">
          <div class="preview-icon">
            <el-icon :size="80" color="#409eff">
              <document v-if="isOffice" />
              <folder v-else-if="isZip" />
              <files v-else />
            </el-icon>
          </div>
          <div class="file-info">
            <h3>{{ currentFile?.origin_name }}</h3>
            <p>文件大小: {{ formatFileSize(currentFile?.file_size) }}</p>
            <p>文件类型: {{ currentFile?.suffix }}</p>
            <p v-if="currentFile?.create_time">
              上传时间: {{ formatDate(currentFile?.create_time) }}
            </p>
          </div>
          <el-button type="primary" @click="downloadFile">
            <el-icon><download /></el-icon>
            点击下载文件
          </el-button>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <template v-if="fileList.length > 1">
            <el-button @click="prevFile" :disabled="currentIndex === 0">
              <el-icon><arrow-left /></el-icon>
              上一个
            </el-button>
            <span class="page-info">{{ currentIndex + 1 }} / {{ fileList.length }}</span>
            <el-button @click="nextFile" :disabled="currentIndex === fileList.length - 1">
              下一个
              <el-icon><arrow-right /></el-icon>
            </el-button>
          </template>
          <el-button @click="dialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  FullScreen,
  Aim,
  Download,
  Loading,
  Document,
  Folder,
  Files,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  file: {
    type: Object,
    default: null
  },
  fileList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentIndex = ref(0)
const loading = ref(false)
const isFullscreen = ref(false)

const currentFile = computed(() => {
  if (props.file) return props.file
  if (props.fileList.length > 0) return props.fileList[currentIndex.value]
  return null
})

const fileSuffix = computed(() => {
  if (!currentFile.value) return ''
  return (currentFile.value.suffix || '').toLowerCase()
})

const isImage = computed(() => {
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(fileSuffix.value)
})

const isVideo = computed(() => {
  return ['.mp4', '.webm', '.ogg'].includes(fileSuffix.value)
})

const isPdf = computed(() => {
  return fileSuffix.value === '.pdf'
})

const isOffice = computed(() => {
  return ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(fileSuffix.value)
})

const isZip = computed(() => {
  return ['.zip', '.rar', '.7z'].includes(fileSuffix.value)
})

watch(() => props.file, (newFile) => {
  if (newFile && props.fileList.length > 0) {
    currentIndex.value = props.fileList.findIndex(f => f.file_id === newFile.file_id)
    if (currentIndex.value === -1) currentIndex.value = 0
  }
})

watch(dialogVisible, (val) => {
  if (val) {
    loading.value = true
    setTimeout(() => {
      loading.value = false
    }, 500)
  }
})

const prevFile = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    loading.value = true
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}

const nextFile = () => {
  if (currentIndex.value < props.fileList.length - 1) {
    currentIndex.value++
    loading.value = true
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const downloadFile = () => {
  if (!currentFile.value?.oss_url) {
    ElMessage.error('文件地址不存在')
    return
  }
  const link = document.createElement('a')
  link.href = currentFile.value.oss_url
  link.download = currentFile.value.origin_name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const formatFileSize = (size) => {
  if (!size) return '-'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB'
  return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.file-preview {
  width: 100%;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #909399;
}

.image-preview {
  width: 100%;
  display: flex;
  justify-content: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.video-preview {
  width: 100%;
  display: flex;
  justify-content: center;
}

.video-preview video {
  max-width: 100%;
  max-height: 70vh;
}

.pdf-preview {
  width: 100%;
}

.other-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 40px;
}

.preview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-info {
  text-align: center;
  color: #606266;
}

.file-info h3 {
  margin: 0 0 12px 0;
  color: #303133;
}

.file-info p {
  margin: 6px 0;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-info {
  color: #909399;
  font-size: 14px;
}
</style>
