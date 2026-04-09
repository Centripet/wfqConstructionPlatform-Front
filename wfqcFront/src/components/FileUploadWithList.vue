<template>
  <div class="file-upload-with-list">
    <FileUploader
      v-if="showUpload"
      ref="uploaderRef"
      v-model="uploadResult"
      :multiple="multiple"
      :limit="limit"
      :accept="accept"
      :max-size-flag="maxSizeFlag"
      :file-type="fileType"
      :show-file-list="showUploadFileList"
      :tip-text="tipText"
      @success="handleUploadSuccess"
      @error="handleUploadError"
    />

    <el-divider v-if="showUpload && fileList.length > 0" />

    <FileList
      v-model="fileList"
      :deletable="deletable"
      :need-load-urls="needLoadUrls"
      @delete="handleFileDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FileUploader from './FileUploader.vue'
import FileList from './FileList.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  showUpload: {
    type: Boolean,
    default: true
  },
  multiple: {
    type: Boolean,
    default: true
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
  showUploadFileList: {
    type: Boolean,
    default: true
  },
  tipText: {
    type: String,
    default: '支持 jpg/jpeg/png/gif/bmp/pdf/doc/docx/xls/xlsx/txt/zip/rar/mp4/gltf/obj 格式文件'
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

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error', 'file-delete'])

const uploaderRef = ref(null)
const uploadResult = ref([])

const fileList = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleUploadSuccess = (files) => {
  fileList.value = [...fileList.value, ...files]
  emit('upload-success', files)
  uploadResult.value = []
}

const handleUploadError = (error) => {
  emit('upload-error', error)
}

const handleFileDelete = (file) => {
  emit('file-delete', file)
}

defineExpose({
  uploaderRef,
  startUpload: () => {
    if (uploaderRef.value) {
      uploaderRef.value.startUpload()
    }
  },
  clearFiles: () => {
    if (uploaderRef.value) {
      uploaderRef.value.clearFiles()
    }
  }
})
</script>

<style scoped>
.file-upload-with-list {
  width: 100%;
}
</style>
