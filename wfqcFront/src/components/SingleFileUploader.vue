<template>
  <div class="single-file-uploader">
    <div class="upload-area" @click="openUploadDialog">
      <div v-if="!currentFile" class="upload-placeholder">
        <el-icon class="upload-icon" :size="40"><UploadFilled /></el-icon>
        <div class="upload-text">点击上传文件</div>
        <div class="upload-tip">支持 jpg/jpeg/png/gif/bmp/pdf/doc/docx/xls/xlsx/txt/zip/rar/mp4/gltf/obj 格式，最大50MB</div>
      </div>
      <div v-else class="file-info">
        <div class="file-icon">
          <el-icon :size="32" :color="getFileIconColor(currentFile)">
            <Picture v-if="isImage(currentFile)" />
            <VideoCamera v-else-if="isVideo(currentFile)" />
            <Document v-else-if="isPDF(currentFile) || isOffice(currentFile)" />
            <Folder v-else-if="isZip(currentFile)" />
            <Files v-else />
          </el-icon>
        </div>
        <div class="file-detail">
          <div class="file-name" :title="currentFile.origin_name">{{ currentFile.origin_name }}</div>
          <div class="file-meta">
            <span>{{ formatFileSize(currentFile.file_size) }}</span>
          </div>
        </div>
        <div class="file-actions">
          <el-tooltip content="预览" placement="top">
            <el-button type="primary" link @click.stop="handlePreview">
              <el-icon><View /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="重新上传" placement="top">
            <el-button type="primary" link @click.stop="openUploadDialog">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button type="danger" link @click.stop="handleDelete">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @closed="handleDialogClosed"
      draggable
    >
      <FileUploader
        ref="uploaderRef"
        :multiple="false"
        :limit="1"
        :max-size-flag="0"
        :file-type="fileType"
        @success="handleUploadSuccess"
        @error="handleUploadError"
      />
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <FilePreview
      v-model="previewVisible"
      :file="currentFile"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  UploadFilled,
  Picture,
  VideoCamera,
  Document,
  Folder,
  Files,
  View,
  Refresh,
  Delete
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import FileUploader from './FileUploader.vue'
import FilePreview from './FilePreview.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  fileType: {
    type: Number,
    default: 0
  },
  fileData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'upload-success', 'upload-error'])

const uploadDialogVisible = ref(false)
const previewVisible = ref(false)
const uploaderRef = ref(null)
const currentFileId = ref('')
const currentFileData = ref(null)

const currentFile = computed(() => {
  if (props.fileData) return props.fileData
  return currentFileData.value
})

watch(() => props.modelValue, (newVal) => {
  currentFileId.value = newVal
})

watch(() => props.fileData, (newVal) => {
  if (newVal) {
    currentFileId.value = newVal.file_id
    currentFileData.value = newVal
  }
})

const isImage = (file) => {
  const suffix = (file?.suffix || '').toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(suffix)
}

const isVideo = (file) => {
  const suffix = (file?.suffix || '').toLowerCase()
  return ['.mp4', '.webm', '.ogg'].includes(suffix)
}

const isPDF = (file) => {
  const suffix = (file?.suffix || '').toLowerCase()
  return suffix === '.pdf'
}

const isOffice = (file) => {
  const suffix = (file?.suffix || '').toLowerCase()
  return ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(suffix)
}

const isZip = (file) => {
  const suffix = (file?.suffix || '').toLowerCase()
  return ['.zip', '.rar', '.7z'].includes(suffix)
}

const getFileIconColor = (file) => {
  if (isImage(file)) return '#e6a23c'
  if (isVideo(file)) return '#67c23a'
  if (isPDF(file)) return '#f56c6c'
  if (isOffice(file)) return '#409eff'
  if (isZip(file)) return '#909399'
  return '#409eff'
}

const formatFileSize = (size) => {
  if (!size) return '-'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB'
  return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const openUploadDialog = () => {
  uploadDialogVisible.value = true
}

const handleDialogClosed = () => {
  if (uploaderRef.value) {
    uploaderRef.value.clearFiles()
  }
}

const handleUploadSuccess = (files) => {
  if (files && files.length > 0) {
    const file = files[0]
    currentFileId.value = file.file_id
    currentFileData.value = file
    emit('update:modelValue', file.file_id)
    emit('change', file)
    emit('upload-success', file)
    uploadDialogVisible.value = false
    ElMessage.success('上传成功')
  }
}

const handleUploadError = (error) => {
  emit('upload-error', error)
  ElMessage.error(error.message || '上传失败')
}

const handlePreview = () => {
  if (currentFile.value) {
    previewVisible.value = true
  }
}

const handleDelete = () => {
  currentFileId.value = ''
  currentFileData.value = null
  emit('update:modelValue', '')
  emit('change', null)
  ElMessage.success('已删除')
}

defineExpose({
  currentFile
})
</script>

<style scoped>
.single-file-uploader {
  width: 100%;
}

.upload-area {
  width: 100%;
  min-height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
}

.upload-icon {
  color: #c0c4cc;
}

.upload-text {
  font-size: 14px;
  color: #606266;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.file-info {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.file-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-detail {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.file-actions {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
}
</style>
