<template>
  <div class="quality-inspection">
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
        添加检查
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
      <el-table-column prop="inspection_item" label="检查项目" width="180" />
      <el-table-column prop="inspection_standard" label="检查标准" width="180" />
      <el-table-column label="检查结果" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.inspection_result === 1 ? 'success' : 'danger'">
            {{ scope.row.inspection_result === 1 ? '合格' : '不合格' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="inspector" label="检查人" width="120" />
      <el-table-column label="检查时间" width="120">
        <template #default="scope">
          {{ scope.row.inspection_time || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="rectification_requirement" label="整改要求" show-overflow-tooltip />
      <el-table-column prop="rectification_responsible" label="整改负责人" width="120" />
      <el-table-column label="整改完成时间" width="140">
        <template #default="scope">
          {{ scope.row.rectification_completion_time || '-' }}
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
      :title="isEdit ? '编辑检查' : '添加检查'"
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
        <el-form-item label="检查项目" prop="inspection_item">
          <el-input v-model="form.inspection_item" placeholder="请输入检查项目" />
        </el-form-item>
        <el-form-item label="检查标准" prop="inspection_standard">
          <el-input v-model="form.inspection_standard" placeholder="请输入检查标准" />
        </el-form-item>
        <el-form-item label="检查结果" prop="inspection_result">
          <el-select v-model="form.inspection_result" placeholder="请选择检查结果" style="width: 100%;">
            <el-option label="合格" :value="1" />
            <el-option label="不合格" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="检查人" prop="inspector">
          <el-input v-model="form.inspector" placeholder="请输入检查人" />
        </el-form-item>
        <el-form-item label="检查时间" prop="inspection_time">
          <el-date-picker
            v-model="form.inspection_time"
            type="date"
            placeholder="请选择检查时间"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="整改要求" prop="rectification_requirement">
          <el-input v-model="form.rectification_requirement" type="textarea" :rows="3" placeholder="请输入整改要求" />
        </el-form-item>
        <el-form-item label="整改负责人" prop="rectification_responsible">
          <el-input v-model="form.rectification_responsible" placeholder="请输入整改负责人" />
        </el-form-item>
        <el-form-item label="整改完成时间" prop="rectification_completion_time">
          <el-date-picker
            v-model="form.rectification_completion_time"
            type="date"
            placeholder="请选择整改完成时间"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
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
import { qualityInsApi } from '@/api/qualityIns'
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
  quality_id: '',
  project_id: '',
  inspection_item: '',
  inspection_standard: '',
  inspection_result: 1,
  inspector: '',
  inspection_time: '',
  rectification_requirement: '',
  rectification_responsible: '',
  rectification_completion_time: ''
})

const rules = {
  project_id: [{ required: true, message: '请选择项目', trigger: 'change' }],
  inspection_item: [{ required: true, message: '请输入检查项目', trigger: 'blur' }],
  inspection_standard: [{ required: true, message: '请输入检查标准', trigger: 'blur' }],
  inspection_result: [{ required: true, message: '请选择检查结果', trigger: 'change' }]
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
    const res = await qualityInsApi.qualityInsList(params)
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
    quality_id: '',
    project_id: selectedProjectId.value || '',
    inspection_item: '',
    inspection_standard: '',
    inspection_result: 1,
    inspector: '',
    inspection_time: '',
    rectification_requirement: '',
    rectification_responsible: '',
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
          res = await qualityInsApi.qualityInsModify(form.value)
        } else {
          res = await qualityInsApi.qualityInsSubmit(form.value)
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
    `确定要删除检查 "${row.inspection_item}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await qualityInsApi.qualityInsDelete({ quality_id: row.quality_id })
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
.quality-inspection {
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
