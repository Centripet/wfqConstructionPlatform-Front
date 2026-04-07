<template>
  <div class="collaboration">
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
        添加协同
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
      <el-table-column prop="topic" label="主题" width="180" />
      <el-table-column prop="initiator" label="发起人" width="120" />
      <el-table-column prop="participants" label="参与人员" show-overflow-tooltip />
      <el-table-column label="沟通时间" width="140">
        <template #default="scope">
          {{ scope.row.communication_time || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="communication_method" label="沟通方式" width="120" />
      <el-table-column prop="content_summary" label="内容摘要" show-overflow-tooltip />
      <el-table-column prop="is_solved" label="是否解决" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.is_solved ? 'success' : 'info'">
            {{ scope.row.is_solved ? '已解决' : '未解决' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="follow_up_person" label="跟进人" width="120" />
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
      :title="isEdit ? '编辑协同' : '添加协同'"
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
        <el-form-item label="主题" prop="topic">
          <el-input v-model="form.topic" placeholder="请输入主题" />
        </el-form-item>
        <el-form-item label="发起人" prop="initiator">
          <el-input v-model="form.initiator" placeholder="请输入发起人" />
        </el-form-item>
        <el-form-item label="参与人员" prop="participants">
          <el-input v-model="form.participants" placeholder="请输入参与人员" />
        </el-form-item>
        <el-form-item label="沟通时间" prop="communication_time">
          <el-date-picker
            v-model="form.communication_time"
            type="date"
            placeholder="请选择沟通时间"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="沟通方式" prop="communication_method">
          <el-input v-model="form.communication_method" placeholder="请输入沟通方式" />
        </el-form-item>
        <el-form-item label="内容摘要" prop="content_summary">
          <el-input v-model="form.content_summary" type="textarea" :rows="3" placeholder="请输入内容摘要" />
        </el-form-item>
        <el-form-item label="是否解决" prop="is_solved">
          <el-select v-model="form.is_solved" placeholder="请选择" style="width: 100%;">
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进人" prop="follow_up_person">
          <el-input v-model="form.follow_up_person" placeholder="请输入跟进人" />
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
import { cooperationApi } from '@/api/cooperation'
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
  coop_id: '',
  project_id: '',
  topic: '',
  initiator: '',
  participants: '',
  communication_time: '',
  communication_method: '',
  content_summary: '',
  is_solved: false,
  follow_up_person: ''
})

const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  topic: [{ required: true, message: '请输入主题', trigger: 'blur' }],
  initiator: [{ required: true, message: '请输入发起人', trigger: 'blur' }],
  communication_time: [{ required: true, message: '请选择沟通时间', trigger: 'change' }]
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
    const res = await cooperationApi.cooperationList(params)
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
    coop_id: '',
    project_id: selectedProjectId.value || '',
    topic: '',
    initiator: '',
    participants: '',
    communication_time: '',
    communication_method: '',
    content_summary: '',
    is_solved: false,
    follow_up_person: ''
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
          res = await cooperationApi.cooperationModify(form.value)
        } else {
          res = await cooperationApi.cooperationSubmit(form.value)
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
    `确定要删除协同 "${row.topic}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await cooperationApi.cooperationDelete({ coop_id: row.coop_id })
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
.collaboration {
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
