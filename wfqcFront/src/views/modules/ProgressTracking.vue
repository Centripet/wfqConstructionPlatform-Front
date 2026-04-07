<template>
  <div class="progress-tracking">
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
        添加进度
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
      <el-table-column prop="task_name" label="任务名称" width="200" />
      <el-table-column label="计划开始" width="120">
        <template #default="scope">
          {{ scope.row.plan_start_time || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="计划结束" width="120">
        <template #default="scope">
          {{ scope.row.plan_end_time || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="实际开始" width="120">
        <template #default="scope">
          {{ scope.row.actual_start_time || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="实际结束" width="120">
        <template #default="scope">
          {{ scope.row.actual_end_time || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="进度(%)" width="100">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress_percentage || 0" :stroke-width="10" />
        </template>
      </el-table-column>
      <el-table-column prop="responsible_person" label="负责人" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getTaskStatusType(scope.row.status)">
            {{ scope.row.status || '进行中' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lag_reason" label="滞后原因" show-overflow-tooltip />
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
      :title="isEdit ? '编辑进度' : '添加进度'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
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
        <el-form-item label="任务名称" prop="task_name">
          <el-input v-model="form.task_name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="计划开始" prop="plan_start_time">
          <el-date-picker
            v-model="form.plan_start_time"
            type="date"
            placeholder="请选择计划开始日期"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="计划结束" prop="plan_end_time">
          <el-date-picker
            v-model="form.plan_end_time"
            type="date"
            placeholder="请选择计划结束日期"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="实际开始" prop="actual_start_time">
          <el-date-picker
            v-model="form.actual_start_time"
            type="date"
            placeholder="请选择实际开始日期"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="实际结束" prop="actual_end_time">
          <el-date-picker
            v-model="form.actual_end_time"
            type="date"
            placeholder="请选择实际结束日期"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="进度(%)" prop="progress_percentage">
          <el-input-number v-model="form.progress_percentage" :min="0" :max="100" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="负责人" prop="responsible_person">
          <el-input v-model="form.responsible_person" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-input v-model="form.status" placeholder="请输入状态" />
        </el-form-item>
        <el-form-item label="滞后原因" prop="lag_reason">
          <el-input v-model="form.lag_reason" type="textarea" :rows="3" placeholder="请输入滞后原因" />
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
import { projectProgressApi } from '@/api/projectProgress'
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
  progress_id: '',
  project_id: '',
  task_name: '',
  plan_start_time: '',
  plan_end_time: '',
  actual_start_time: '',
  actual_end_time: '',
  progress_percentage: 0,
  responsible_person: '',
  lag_reason: '',
  status: '进行中'
})

const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  task_name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  plan_start_time: [{ required: true, message: '请选择计划开始日期', trigger: 'change' }],
  plan_end_time: [{ required: true, message: '请选择计划结束日期', trigger: 'change' }]
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

const getTaskStatusType = (status) => {
  const statusMap = { '已完成': 'success', '进行中': 'primary', '滞后': 'warning', '暂停': 'info' }
  return statusMap[status] || 'info'
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
    const res = await projectProgressApi.projectProgressList(params)
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
    progress_id: '',
    project_id: selectedProjectId.value || '',
    task_name: '',
    plan_start_time: '',
    plan_end_time: '',
    actual_start_time: '',
    actual_end_time: '',
    progress_percentage: 0,
    responsible_person: '',
    lag_reason: '',
    status: '进行中'
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
          res = await projectProgressApi.projectProgressModify(form.value)
        } else {
          res = await projectProgressApi.projectProgressSubmit(form.value)
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
    `确定要删除任务 "${row.task_name}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await projectProgressApi.projectProgressDelete({ progress_id: row.progress_id })
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
.progress-tracking {
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
