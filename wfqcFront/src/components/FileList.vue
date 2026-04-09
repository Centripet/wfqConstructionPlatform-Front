<template>
  <div class="file-list">
    <div v-if="fileList.length === 0" class="empty-state">
      <el-empty description="暂无文件" />
    </div>

    <div v-else class="files-container">
      <div
        v-for="file in fileList"
        :key="file.file_id"
        class="file-item"
        @click="handlePreview(file)"
      >
        <div class="file-icon">
          <el-icon :size="32" :color="getFileIconColor(file)">
            <picture v-if="isImage(file)" />
            <video-camera v-else-if="isVideo(file)" />
            <document v-else-if="isPDF(file) || isOffice(file)" />
            <folder v-else-if="isZip(file)" />
            <files v-else />
          </el-icon>
        </div>
        <div class="file-info">
          <div class="file-name" :title="file.origin_name">
            {{ file.origin_name }}
          </div>
          <div class="file-meta">
            <span class="file-size">{{ formatFileSize(file.file_size) }}</span>
            <span v-if="file.create_time" class="file-time">
              {{ formatDate(file.create_time) }}
            </span>
          </div>
        </div>
        <div class="file-actions" @click.stop>
          <el-tooltip content="预览" placement="top">
            <el-button type="primary" link @click="handlePreview(file)">
              <el-icon><view /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="下载" placement="top">
            <el-button type="primary" link @click="handleDownload(file)">
              <el-icon><download /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip v-if="deletable" content="删除" placement="top">
            <el-button type="danger" link @click="handleDelete(file)">
              <el-icon><delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <FilePreview
      v-model="previewVisible"
      :file="currentPreviewFile"
      :file-list="fileList"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Picture,
  VideoCamera,
  Document,
  Folder,
  Files,
  View,
  Download,
  Delete
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import FilePreview from './FilePreview.vue'
import { fileApi } from '@/api/file'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  deletable: {
    type: Boolean,
    default: true
  },
  needLoadUrls: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'preview', 'download', 'delete'])

const previewVisible = ref(false)
const currentPreviewFile = ref(null)
const fileListWithUrls = ref([])

const fileList = computed({
  get: () => fileListWithUrls.value.length > 0 ? fileListWithUrls.value : props.modelValue,
  set: (val) => {
    fileListWithUrls.value = val
    emit('update:modelValue', val)
  }
})

const loadFileUrls = async () => {
  if (!props.needLoadUrls || props.modelValue.length === 0) {
    fileListWithUrls.value = props.modelValue
    return
  }

  const fileIds = props.modelValue
    .filter(f => f.file_id && !f.oss_url)
    .map(f => f.file_id)

  if (fileIds.length === 0) {
    fileListWithUrls.value = props.modelValue
    return
  }

  try {
    const res = await fileApi.fileUrlsGen({ files_id: fileIds })
    if (res.success) {
      const urlMap = {}
      res.data.forEach(f => {
        urlMap[f.file_id] = f
      })
      fileListWithUrls.value = props.modelValue.map(f => {
        if (urlMap[f.file_id]) {
          return { ...f, ...urlMap[f.file_id] }
        }
        return f
      })
    }
  } catch (error) {
    console.error('加载文件URL失败:', error)
    fileListWithUrls.value = props.modelValue
  }
}

const isImage = (file) => {
  const suffix = (file.suffix || '').toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(suffix)
}

const isVideo = (file) => {
  const suffix = (file.suffix || '').toLowerCase()
  return ['.mp4', '.webm', '.ogg'].includes(suffix)
}

const isPDF = (file) => {
  const suffix = (file.suffix || '').toLowerCase()
  return suffix === '.pdf'
}

const isOffice = (file) => {
  const suffix = (file.suffix || '').toLowerCase()
  return ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(suffix)
}

const isZip = (file) => {
  const suffix = (file.suffix || '').toLowerCase()
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

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const handlePreview = (file) => {
  currentPreviewFile.value = file
  previewVisible.value = true
  emit('preview', file)
}

const handleDownload = (file) => {
  if (!file.oss_url) {
    ElMessage.error('文件地址不存在')
    return
  }
  const link = document.createElement('a')
  link.href = file.oss_url
  link.download = file.origin_name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  emit('download', file)
}

const handleDelete = async (file) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件「${file.origin_name}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    fileList.value = fileList.value.filter(f => f.file_id !== file.file_id)
    emit('delete', file)
    ElMessage.success('删除成功')
  } catch {
  }
}

loadFileUrls()
</script>

<style scoped>
.file-list {
  width: 100%;
}

.empty-state {
  padding: 40px 0;
}

.files-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-item:hover {
  background: #ecf5ff;
}

.file-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #fff;
  border-radius: 8px;
}

.file-info {
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
  display: flex;
  gap: 12px;
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
