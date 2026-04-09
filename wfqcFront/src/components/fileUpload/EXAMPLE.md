# 文件上传组件使用示例

## 组件说明

本组件库提供了4个文件相关的组件：

1. **FileUploader** - 基础文件上传组件
2. **FilePreview** - 文件预览组件
3. **FileList** - 文件列表展示组件
4. **FileUploadWithList** - 综合上传+列表组件（推荐使用）

## 快速开始

### 方式一：使用综合组件（推荐）

```vue
<template>
  <div class="demo">
    <FileUploadWithList
      v-model="files"
      :multiple="true"
      :limit="10"
      @upload-success="handleUploadSuccess"
      @file-delete="handleFileDelete"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FileUploadWithList } from '@/components/fileUpload'

const files = ref([])

const handleUploadSuccess = (newFiles) => {
  console.log('上传成功:', newFiles)
}

const handleFileDelete = (file) => {
  console.log('删除文件:', file)
}
</script>
```

### 方式二：单独使用上传组件

```vue
<template>
  <div class="demo">
    <FileUploader
      ref="uploaderRef"
      v-model="uploadResult"
      :multiple="true"
      :limit="5"
      accept=".jpg,.jpeg,.png"
      :max-size-flag="0"
      :file-type="1"
      @success="handleSuccess"
      @error="handleError"
    />
    <el-button @click="submit">提交业务</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FileUploader } from '@/components/fileUpload'

const uploaderRef = ref(null)
const uploadResult = ref([])

const handleSuccess = (files) => {
  console.log('上传成功:', files)
}

const handleError = (error) => {
  console.error('上传失败:', error)
}

const submit = () => {
  const fileIds = uploadResult.value.map(f => f.file_id)
  console.log('提交业务，文件ID:', fileIds)
}
</script>
```

### 方式三：单独使用文件列表组件

```vue
<template>
  <div class="demo">
    <FileList
      v-model="files"
      :deletable="true"
      :need-load-urls="true"
      @preview="handlePreview"
      @download="handleDownload"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { FileList } from '@/components/fileUpload'
import { projectApi } from '@/api/project'

const files = ref([])

onMounted(async () => {
  const res = await projectApi.getProjectFiles({ project_id: 'xxx' })
  if (res.success) {
    files.value = res.data
  }
})

const handlePreview = (file) => {
  console.log('预览文件:', file)
}

const handleDownload = (file) => {
  console.log('下载文件:', file)
}

const handleDelete = (file) => {
  console.log('删除文件:', file)
}
</script>
```

### 方式四：单独使用预览组件

```vue
<template>
  <div class="demo">
    <el-button @click="openPreview">打开预览</el-button>
    <FilePreview
      v-model="previewVisible"
      :file="currentFile"
      :file-list="fileList"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FilePreview } from '@/components/fileUpload'

const previewVisible = ref(false)
const currentFile = ref({
  file_id: 'xxx',
  origin_name: 'example.jpg',
  suffix: '.jpg',
  oss_url: 'https://example.com/xxx.jpg'
})
const fileList = ref([currentFile.value])

const openPreview = () => {
  previewVisible.value = true
}
</script>
```

## API 文档

### FileUploader Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| v-model | 上传结果，返回文件信息数组 | Array | [] |
| multiple | 是否支持多选文件 | Boolean | false |
| limit | 最大上传数量 | Number | 10 |
| accept | 接受的文件类型 | String | 见代码 |
| maxSizeFlag | 文件大小限制标识 0=50MB 1=500MB | Number | 0 |
| fileType | 文件类型标识 | Number | 0 |
| showFileList | 是否显示文件列表 | Boolean | true |
| tipText | 提示文本 | String | 见代码 |

### FileUploader Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| success | 上传成功 | files: Array |
| error | 上传失败 | error: Error |
| change | 文件选择改变 | fileList: Array |
| remove | 文件移除 | file, fileList |

### FileUploader Expose

| 方法名 | 说明 |
|--------|------|
| startUpload | 开始上传 |
| clearFiles | 清空文件 |

### FileList Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| v-model | 文件列表 | Array | [] |
| deletable | 是否可删除 | Boolean | true |
| needLoadUrls | 是否需要加载URL | Boolean | true |

### FileList Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| preview | 预览文件 | file: Object |
| download | 下载文件 | file: Object |
| delete | 删除文件 | file: Object |

### FilePreview Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| v-model | 是否显示对话框 | Boolean | false |
| file | 当前预览的文件 | Object | null |
| fileList | 文件列表（用于多文件预览） | Array | [] |

### FileUploadWithList Props

继承 FileUploader 和 FileList 的所有 Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| showUpload | 是否显示上传区域 | Boolean | true |

### FileUploadWithList Events

继承 FileUploader 和 FileList 的所有 Events

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| upload-success | 上传成功 | files: Array |
| upload-error | 上传失败 | error: Error |
| file-delete | 删除文件 | file: Object |

### FileUploadWithList Expose

| 方法名 | 说明 |
|--------|------|
| startUpload | 开始上传 |
| clearFiles | 清空文件 |
| uploaderRef | 上传组件引用 |

## 后端接口说明

### 1. 获取上传凭证

**接口**: `POST /api/file/uploadPolicy`

**请求参数**:
```json
{
  "suffix": ".jpg",
  "MAX_SIZE_FLAG": 0
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "accessKeyId": "xxx",
    "policy": "xxx",
    "signature": "xxx",
    "key": "uploads/general/xxx/2026/04/09/uuid.jpg",
    "host": "https://bucket.oss-cn-beijing.aliyuncs.com",
    "expire": 1234567890
  }
}
```

### 2. 上传文件到OSS

直接使用获取到的凭证上传到阿里云OSS

### 3. 检查上传状态

**接口**: `POST /api/file/uploadStatus`

**请求参数**:
```json
{
  "files": [
    {
      "key": "uploads/...",
      "suffix": ".jpg",
      "origin_name": "文件名.jpg",
      "type": 0,
      "title": "文件名",
      "info": ""
    }
  ]
}
```

### 4. 提交文件

**接口**: `POST /api/file/fileSubmit`

**请求参数**: 同上

**响应**:
```json
{
  "code": 200,
  "data": [
    {
      "file_id": "xxx",
      "file_key": "uploads/...",
      "origin_name": "文件名.jpg",
      "suffix": ".jpg",
      "file_size": 12345,
      "create_time": "2026-04-09T10:00:00"
    }
  ]
}
```

### 5. 获取文件URL

**接口**: `POST /api/file/fileUrlsGen`

**请求参数**:
```json
{
  "files_id": ["file_id1", "file_id2"]
}
```

**响应**:
```json
{
  "code": 200,
  "data": [
    {
      "file_id": "xxx",
      "oss_url": "https://..."
    }
  ]
}
```

## 注意事项

1. 上传流程：获取凭证 → 上传OSS → 检查状态 → 提交入库
2. 文件后缀必须在允许列表中
3. MAX_SIZE_FLAG: 0=50MB, 1=500MB
4. 业务接口使用返回的 file_id 进行关联
