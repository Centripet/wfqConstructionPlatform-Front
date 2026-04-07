<template>
  <div class="safety-management">
    <div class="search-bar">
      <el-select v-model="selectedProjectId" placeholder="请选择项目" clearable @change="loadData">
        <el-option
          v-for="proj in projectList"
          :key="proj.project_id"
          :label="proj.project_name"
          :value="proj.project_id"
        />
      </el-select>
    </div>
    
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加事件
      </el-button>
      <el-button @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
    
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column label="所属项目" width="150">
        <template #default="scope">
          {{ getProjectName(scope.row.project_id) }}
        </template>
      </el-table-column>
      <el-table-column prop="event_name" label="事件名称" width="180" />
      <el-table-column label="发生时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.occurrence_time) }}
        </template>
      </el-table-column>
      <el-table-column prop="occurrence_place" label="发生地点" width="150" />
      <el-table-column prop="responsible_person" label="责任人" width="120" />
      <el-table-column label="事件等级" width="100">
        <template #default="scope">
          <el-tag :type="getEventLevelType(scope.row.event_level)">
            {{ getEventLevelText(scope.row.event_level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="处理状态" width="100">
        <template #default="scope">
          <el-tag :type="getProcessingStatusType(scope.row.processing_status)">
            {{ getProcessingStatusText(scope.row.processing_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rectification_measures" label="整改措施" show-overflow-tooltip />
      <el-table-column label="整改完成时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.rectification_completion_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
      style="margin-top: 20px; justify-content: flex-end; display: flex;"
    />
    
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑事件' : '添加事件'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="130px">
        <el-form-item label="所属项目" prop="project_id">
          <el-select v-model="form.project_id" placeholder="请选择项目" style="width: 100%;">
            <el-option
              v-for="proj in projectList"
              :key="proj.project_id"
              :label="proj.project_name"
              :value="proj.project_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="事件名称" prop="event_name">
          <el-input v-model="form.event_name" placeholder="请输入事件名称" />
        </el-form-item>
        <el-form-item label="发生时间" prop="occurrence_time">
          <el-date-picker
            v-model="form.occurrence_time"
            type="datetime"
            placeholder="请选择发生时间"
            style="width: 100%;"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="发生地点" prop="occurrence_place">
          <el-input v-model="form.occurrence_place" placeholder="请输入发生地点" />
        </el-form-item>
        <el-form-item label="责任人" prop="responsible_person">
          <el-input v-model="form.responsible_person" placeholder="请输入责任人" />
        </el-form-item>
        <el-form-item label="事件等级" prop="event_level">
          <el-select v-model="form.event_level" placeholder="请选择事件等级" style="width: 100%;">
            <el-option label="一般" :value="0" />
            <el-option label="较大" :value="1" />
            <el-option label="重大" :value="2" />
            <el-option label="特别重大" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态" prop="processing_status">
          <el-select v-model="form.processing_status" placeholder="请选择处理状态" style="width: 100%;">
            <el-option label="待处理" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="已完成" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="整改措施" prop="rectification_measures">
          <el-input v-model="form.rectification_measures" type="textarea" :rows="3" placeholder="请输入整改措施" />
        </el-form-item>
        <el-form-item label="整改完成时间" prop="rectification_completion_time">
          <el-date-picker
            v-model="form.rectification_completion_time"
            type="datetime"
            placeholder="请选择整改完成时间"
            style="width: 100%;"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { safetyEventApi } from '@/api/safetyEvent'
import { projectApi } from '@/api/project'

const loading = ref(false)
const tableData = ref([])
const projectList = ref([])
const selectedProjectId = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  event_id: '',
  project_id: '',
  event_name: '',
  occurrence_time: '',
  occurrence_place: '',
  responsible_person: '',
  event_level: 0,
  processing_status: 0,
  rectification_measures: '',
  rectification_completion_time: ''
})

const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  event_name: [{ required: true, message: '请输入事件名称', trigger: 'blur' }],
  occurrence_time: [{ required: true, message: '请选择发生时间', trigger: 'change' }],
  occurrence_place: [{ required: true, message: '请输入发生地点', trigger: 'blur' }],
  responsible_person: [{ required: true, message: '请输入责任人', trigger: 'blur' }],
  event_level: [{ required: true, message: '请选择事件等级', trigger: 'change' }],
  processing_status: [{ required: true, message: '请选择处理状态', trigger: 'change' }]
}

const loadProjects = async () => {
  try {
    const res = await projectApi.projectList({ page: 1, size: 100 })
    if (res.success) {
      projectList.value = res.data?.records || res.data?.list || res.data || []
    }
  } catch (error) {
    console.error('加载项目列表失败:', error)
  }
}

const getProjectName = (projectId) => {
  const project = projectList.value.find(p => p.project_id === projectId)
  return project ? project.project_name : '-'
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return datetime
}

const getEventLevelType = (level) => {
  const levelMap = { 0: 'info', 1: 'warning', 2: 'danger', 3: 'danger' }
  return levelMap[level] || 'info'
}

const getEventLevelText = (level) => {
  const levelMap = { 0: '一般', 1: '较大', 2: '重大', 3: '特别重大' }
  return levelMap[level] || '未知'
}

const getProcessingStatusType = (status) => {
  const statusMap = { 0: 'info', 1: 'warning', 2: 'success' }
  return statusMap[status] || 'info'
}

const getProcessingStatusText = (status) => {
  const statusMap = { 0: '待处理', 1: '处理中', 2: '已完成' }
  return statusMap[status] || '未知'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (selectedProjectId.value) {
      params.project_id = selectedProjectId.value
    }
    const res = await safetyEventApi.safetyEventList(params)
    if (res.success) {
      tableData.value = res.data?.records || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.message || '加载数据失败')
    }
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    event_id: '',
    project_id: selectedProjectId.value || '',
    event_name: '',
    occurrence_time: '',
    occurrence_place: '',
    responsible_person: '',
    event_level: 0,
    processing_status: 0,
    rectification_measures: '',
    rectification_completion_time: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        if (isEdit.value) {
          res = await safetyEventApi.safetyEventModify(form.value)
        } else {
          res = await safetyEventApi.safetyEventSubmit(form.value)
        }
        if (res.success) {
          ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
          dialogVisible.value = false
          loadData()
        } else {
          ElMessage.error(res.message || '操作失败')
        }
      } catch {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除事件 "${row.event_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await safetyEventApi.safetyEventDelete({ event_id: row.event_id })
      if (res.success) {
        ElMessage.success('删除成功')
        loadData()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch {
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

onMounted(() => {
  loadProjects()
  loadData()
})
</script>

<style scoped>
.safety-management {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar .el-select {
  width: 300px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>
