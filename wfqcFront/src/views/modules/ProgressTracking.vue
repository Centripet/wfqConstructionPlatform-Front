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
      <el-table-column 
        v-for="column in tableColumns" 
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :fixed="column.fixed"
      >
        <template #default="scope">
          <el-progress 
            v-if="column.type === 'progress'" 
            :percentage="scope.row[column.prop] || 0" 
            :stroke-width="10" 
          />
          <el-tag 
            v-else-if="column.tagType" 
            :type="column.tagType(scope.row[column.prop])"
          >
            {{ scope.row[column.prop] || '-' }}
          </el-tag>
          <span v-else-if="column.formatter">
            {{ column.formatter(scope.row) }}
          </span>
          <span v-else>
            {{ scope.row[column.prop] || '-' }}
          </span>
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
      :title="isEdit ? '编辑进度' : '添加进度'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item 
          v-for="field in formFields" 
          :key="field.prop"
          :label="field.label" 
          :prop="field.prop"
        >
          <el-input 
            v-if="field.type === 'input'"
            v-model="form[field.prop]" 
            :placeholder="field.placeholder" 
          />
          <el-select 
            v-else-if="field.type === 'select'"
            v-model="form[field.prop]" 
            :placeholder="field.placeholder" 
            style="width: 100%;"
          >
            <el-option 
              v-for="item in (field.optionsKey === 'projectList' ? projectList : field.options)" 
              :key="item[field.optionValue || 'value']"
              :label="item[field.optionLabel || 'label']" 
              :value="item[field.optionValue || 'value']" 
            />
          </el-select>
          <el-date-picker
            v-else-if="field.type === 'date'"
            v-model="form[field.prop]"
            :type="field.dateType || 'date'"
            :placeholder="field.placeholder"
            style="width: 100%;"
            :value-format="field.valueFormat || 'YYYY-MM-DD'"
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="form[field.prop]" 
            :min="field.min || 0" 
            :max="field.max" 
            :precision="field.precision" 
            style="width: 100%;" 
          />
          <el-input 
            v-else-if="field.type === 'textarea'"
            v-model="form[field.prop]" 
            type="textarea" 
            :rows="field.rows || 3"
            :placeholder="field.placeholder" 
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
import { projectProgressApi } from '@/api/projectProgress'
import { projectApi } from '@/api/project'

// ==================== 配置常量区域 ====================

const TASK_STATUS_CONFIG = {
  '已完成': 'success',
  '进行中': 'primary',
  '滞后': 'warning',
  '暂停': 'info'
}

const tableColumns = [
  { 
    prop: 'project_id', 
    label: '所属项目', 
    width: '150',
    formatter: (row, projectList) => getProjectName(row.project_id, projectList)
  },
  { prop: 'task_name', label: '任务名称', width: '200' },
  { 
    prop: 'plan_start_time', 
    label: '计划开始', 
    width: '120',
    formatter: (row) => row.plan_start_time || '-'
  },
  { 
    prop: 'plan_end_time', 
    label: '计划结束', 
    width: '120',
    formatter: (row) => row.plan_end_time || '-'
  },
  { 
    prop: 'actual_start_time', 
    label: '实际开始', 
    width: '120',
    formatter: (row) => row.actual_start_time || '-'
  },
  { 
    prop: 'actual_end_time', 
    label: '实际结束', 
    width: '120',
    formatter: (row) => row.actual_end_time || '-'
  },
  { 
    prop: 'progress_percentage', 
    label: '进度(%)', 
    width: '100',
    type: 'progress'
  },
  { prop: 'responsible_person', label: '负责人', width: '120' },
  { 
    prop: 'status', 
    label: '状态', 
    width: '100',
    tagType: (val) => TASK_STATUS_CONFIG[val] || 'info'
  },
  { prop: 'lag_reason', label: '滞后原因', showOverflowTooltip: true }
]

const formFields = [
  { 
    prop: 'project_id', 
    label: '所属项目', 
    type: 'select', 
    placeholder: '请选择项目',
    optionsKey: 'projectList',
    optionLabel: 'project_name',
    optionValue: 'project_id',
    required: true
  },
  { 
    prop: 'task_name', 
    label: '任务名称', 
    type: 'input', 
    placeholder: '请输入任务名称',
    required: true
  },
  { 
    prop: 'plan_start_time', 
    label: '计划开始', 
    type: 'date', 
    placeholder: '请选择计划开始日期',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD',
    required: true
  },
  { 
    prop: 'plan_end_time', 
    label: '计划结束', 
    type: 'date', 
    placeholder: '请选择计划结束日期',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD',
    required: true
  },
  { 
    prop: 'actual_start_time', 
    label: '实际开始', 
    type: 'date', 
    placeholder: '请选择实际开始日期',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD'
  },
  { 
    prop: 'actual_end_time', 
    label: '实际结束', 
    type: 'date', 
    placeholder: '请选择实际结束日期',
    dateType: 'date',
    valueFormat: 'YYYY-MM-DD'
  },
  { 
    prop: 'progress_percentage', 
    label: '进度(%)', 
    type: 'number', 
    min: 0,
    max: 100,
    precision: 2,
    placeholder: '请输入进度'
  },
  { 
    prop: 'responsible_person', 
    label: '负责人', 
    type: 'input', 
    placeholder: '请输入负责人'
  },
  { 
    prop: 'status', 
    label: '状态', 
    type: 'input', 
    placeholder: '请输入状态'
  },
  { 
    prop: 'lag_reason', 
    label: '滞后原因', 
    type: 'textarea', 
    placeholder: '请输入滞后原因',
    rows: 3
  }
]

const generateRules = () => {
  const rules = {}
  formFields.forEach(field => {
    if (field.required) {
      rules[field.prop] = [{ required: true, message: `请输入${field.label}`, trigger: field.type === 'select' ? 'change' : 'blur' }]
    }
  })
  return rules
}

const getInitialFormData = () => {
  const formData = { progress_id: '' }
  formFields.forEach(field => {
    if (field.type === 'number') {
      formData[field.prop] = field.min || 0
    } else if (field.type === 'select') {
      formData[field.prop] = ''
    } else {
      formData[field.prop] = ''
    }
  })
  formData.status = '进行中'
  return formData
}

// ==================== 辅助函数 ====================

const getProjectName = (projectId, projectList) => {
  const project = projectList?.find(p => p.project_id === projectId)
  return project ? project.project_name : '-'
}

// ==================== 响应式数据 ====================

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
const form = ref(getInitialFormData())
const rules = generateRules()

// ==================== API 调用 ====================

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
  const initialForm = getInitialFormData()
  form.value = { ...initialForm, project_id: selectedProjectId.value || '' }
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
