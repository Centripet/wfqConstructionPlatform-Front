<template>
  <div class="file-uploader">
    <el-upload
      ref="uploadRef"
      :auto-upload="false"
      :multiple="multiple"
      :limit="limit"
      :accept="accept"
      :show-file-list="showFileList"
      :file-list="fileList"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :on-exceed="handleExceed"
      drag
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将文件拖到此处，或<em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          {{ tipText }}
        </div>
      </template>
    </el-upload>

    <div v-if="fileList.length > 0" class="upload-progress">
      <div v-for="file in fileList" :key="file.uid" class="progress-item">
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>
        <el-progress
          :percentage="file.progress || 0"
          :status="getProgressStatus(file)"
        />
        <div class="file-status">
          <span v-if="file.status === 'success'" class="success-text">上传成功</span>
          <span v-else-if="file.status === 'fail'" class="fail-text">上传失败</span>
          <span v-else-if="file.status === 'uploading'" class="uploading-text">上传中...</span>
          <span v-else>等待上传</span>
        </div>
      </div>
    </div>

    <div v-if="fileList.length > 0" class="upload-actions">
      <el-button type="primary" @click="startUpload" :disabled="uploading || fileList.length === 0" :loading="uploading">
        {{ uploading ? '上传中...' : '开始上传' }}
      </el-button>
      <el-button @click="clearFiles" :disabled="uploading">
        清空
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fileApi, uploadToOSS } from '@/api/file'

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: 10
  },
  accept: {
    type: String,
    default: '.jpg,.jpeg,.png,.gif,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.mp4,.gltf,.obj'
  },
  maxSizeFlag: {
    type: Number,
    default: 0
  },
  fileType: {
    type: Number,
    default: 0
  },
  showFileList: {
    type: Boolean,
    default: true
  },
  tipText: {
    type: String,
    default: '支持 jpg/jpeg/png/gif/bmp/pdf/doc/docx/xls/xlsx/txt/zip/rar/mp4/gltf/obj 格式文件'
  },
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'error', 'change', 'remove'])

const uploadRef = ref(null)
const fileList = ref([])
const uploading = ref(false)

const uploadResults = ref([])

const formatFileSize = (size) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

const getFileSuffix = (filename) => {
  const index = filename.lastIndexOf('.')
  return index !== -1 ? filename.substring(index) : ''
}

const getProgressStatus = (file) => {
  if (file.status === 'success') return 'success'
  if (file.status === 'fail') return 'exception'
  return undefined
}

const handleChange = (file, files) => {
  fileList.value = files.map(f => ({
    ...f,
    progress: 0,
    status: 'ready'
  }))
  emit('change', fileList.value)
}

const handleRemove = (file, files) => {
  fileList.value = files
  emit('remove', file, fileList.value)
}

const handleExceed = (files) => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

const startUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  uploading.value = true
  uploadResults.value = []

  try {
    const uploadPromises = fileList.value.map(async (file) => {
      try {
        file.status = 'uploading'
        file.progress = 0

        const suffix = getFileSuffix(file.name)
        
        const policyRes = await fileApi.uploadPolicy({
          suffix,
          MAX_SIZE_FLAG: props.maxSizeFlag
        })

        if (!policyRes.success) {
          throw new Error(policyRes.message || '获取上传凭证失败')
        }

        const policy = policyRes.data

        await uploadToOSS(policy, file.raw, (percent) => {
          file.progress = percent
        })

        const statusRes = await fileApi.uploadStatus({
          files: [{
            key: policy.key,
            suffix,
            origin_name: file.name,
            type: props.fileType,
            title: file.name,
            info: ''
          }]
        })

        if (!statusRes.success) {
          throw new Error(statusRes.message || '检查上传状态失败')
        }

        const submitRes = await fileApi.fileSubmit({
          files: [{
            key: policy.key,
            suffix,
            origin_name: file.name,
            type: props.fileType,
            title: file.name,
            info: ''
          }]
        })

        if (!submitRes.success) {
          throw new Error(submitRes.message || '提交文件失败')
        }

        file.status = 'success'
        file.progress = 100
        file.fileInfo = submitRes.data[0]
        uploadResults.value.push(submitRes.data[0])

        return submitRes.data[0]
      } catch (error) {
        file.status = 'fail'
        file.error = error.message
        throw error
      }
    })

    await Promise.all(uploadPromises)

    emit('update:modelValue', uploadResults.value)
    emit('success', uploadResults.value)
    ElMessage.success('上传成功')
  } catch (error) {
    emit('error', error)
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

const clearFiles = () => {
  fileList.value = []
  uploadResults.value = []
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

defineExpose({
  startUpload,
  clearFiles,
  fileList,
  uploadResults
})
</script>

<style scoped>
.file-uploader {
  width: 100%;
}

.upload-progress {
  margin-top: 20px;
}

.progress-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.file-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.file-name {
  font-weight: 500;
}

.file-size {
  color: #909399;
}

.file-status {
  margin-top: 8px;
  font-size: 12px;
}

.success-text {
  color: #67c23a;
}

.fail-text {
  color: #f56c6c;
}

.uploading-text {
  color: #409eff;
}

.upload-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}
</style>
