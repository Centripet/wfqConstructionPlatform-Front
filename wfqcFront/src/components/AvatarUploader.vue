<template>
  <div class="avatar-uploader">
    <div class="upload-area" @click="openUploadDialog">
      <div v-if="!currentFile" class="upload-placeholder">
        <el-icon class="upload-icon" :size="48"><Camera /></el-icon>
        <div class="upload-text">点击上传头像</div>
        <div class="upload-tip">支持 jpg/jpeg/png 格式，最大2MB</div>
      </div>
      <div v-else class="avatar-preview">
        <img :src="avatarUrl" alt="用户头像" class="avatar-img" />
        <div class="avatar-overlay">
          <el-button type="primary" link @click.stop="openUploadDialog">
            <el-icon><Refresh /></el-icon> 重新上传
          </el-button>
          <el-button type="danger" link @click.stop="handleDelete">
            <el-icon><Delete /></el-icon> 删除
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="uploadDialogVisible"
      title="上传头像"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @closed="handleDialogClosed"
    >
      <FileUploader
        ref="uploaderRef"
        :multiple="false"
        :limit="1"
        accept=".jpg,.jpeg,.png"
        :max-size-flag="0"
        :file-type="1"
        :show-file-list="true"
        @success="handleUploadSuccess"
        @error="handleUploadError"
      />
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Camera, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import FileUploader from './FileUploader.vue'
import { fileApi } from '@/api/file'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const uploadDialogVisible = ref(false)
const uploaderRef = ref(null)
const currentFile = ref(props.modelValue)
const avatarUrl = ref('')

const loadAvatarUrl = async (fileId) => {
  if (fileId) {
    try {
      const response = await fileApi.fileUrlsGen({ files_id: [fileId] })
      if (response.success && response.data && response.data.length > 0) {
        avatarUrl.value = response.data[0].oss_url
      }
    } catch (error) {
      console.error('获取头像URL失败:', error)
    }
  }
}

const openUploadDialog = () => {
  uploadDialogVisible.value = true
}

const handleUploadSuccess = (files) => {
  if (files && files.length > 0) {
    currentFile.value = files[0]
    emit('update:modelValue', files[0])
    loadAvatarUrl(files[0].file_id)
    uploadDialogVisible.value = false
    ElMessage.success('头像上传成功')
  }
}

const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败')
}

const handleDelete = () => {
  currentFile.value = null
  avatarUrl.value = ''
  emit('update:modelValue', null)
  ElMessage.success('头像已删除')
}

const handleDialogClosed = () => {
  if (uploaderRef.value) {
    uploaderRef.value.clearFiles()
  }
}

watch(() => props.modelValue, (newValue) => {
  currentFile.value = newValue
  if (newValue) {
    loadAvatarUrl(newValue.file_id)
  } else {
    avatarUrl.value = ''
  }
}, { immediate: true })
</script>

<style scoped>
.avatar-uploader {
  width: 100%;
}

.upload-area {
  width: 120px;
  height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
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
  padding: 16px;
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

.avatar-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-preview:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay .el-button {
  color: #fff;
  font-size: 12px;
}
</style>