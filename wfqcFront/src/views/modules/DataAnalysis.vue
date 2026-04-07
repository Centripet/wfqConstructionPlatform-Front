<template>
  <div class="data-analysis">
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索数据来源或数据类型" style="width: 300px;" clearable />
    </div>
    
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加分析
      </el-button>
      <el-button @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>
    
    <el-table :data="tableData" style="width: 100%" v-loading="loading">
      <el-table-column prop="data_source" label="数据来源" width="150" />
      <el-table-column prop="data_type" label="数据类型" width="150" />
      <el-table-column label="采集时间" width="140">
        <template #default="scope">
          {{ formatDateTime(scope.row.collection_time) }}
        </template>
      </el-table-column>
      <el-table-column prop="data_description" label="数据描述" show-overflow-tooltip />
      <el-table-column prop="analysis_method" label="分析方法" width="120" />
      <el-table-column prop="analyst" label="分析师" width="120" />
      <el-table-column prop="analysis_period" label="分析周期" width="120" />
      <el-table-column prop="key_indicator" label="关键指标" width="150" />
      <el-table-column prop="indicator_value" label="指标值" width="120" />
      <el-table-column prop="analysis_result" label="分析结果" show-overflow-tooltip />
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
      :title="isEdit ? '编辑数据分析' : '添加数据分析'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="文件ID" prop="file_id">
          <el-input v-model="form.file_id" placeholder="请输入文件ID" />
        </el-form-item>
        <el-form-item label="数据来源" prop="data_source">
          <el-input v-model="form.data_source" placeholder="请输入数据来源" />
        </el-form-item>
        <el-form-item label="数据类型" prop="data_type">
          <el-input v-model="form.data_type" placeholder="请输入数据类型" />
        </el-form-item>
        <el-form-item label="采集时间" prop="collection_time">
          <el-date-picker
            v-model="form.collection_time"
            type="date"
            placeholder="请选择采集时间"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="数据描述" prop="data_description">
          <el-input v-model="form.data_description" type="textarea" :rows="3" placeholder="请输入数据描述" />
        </el-form-item>
        <el-form-item label="分析方法" prop="analysis_method">
          <el-input v-model="form.analysis_method" placeholder="请输入分析方法" />
        </el-form-item>
        <el-form-item label="分析师" prop="analyst">
          <el-input v-model="form.analyst" placeholder="请输入分析师" />
        </el-form-item>
        <el-form-item label="分析周期" prop="analysis_period">
          <el-input v-model="form.analysis_period" placeholder="请输入分析周期" />
        </el-form-item>
        <el-form-item label="关键指标" prop="key_indicator">
          <el-input v-model="form.key_indicator" placeholder="请输入关键指标" />
        </el-form-item>
        <el-form-item label="指标值" prop="indicator_value">
          <el-input-number v-model="form.indicator_value" :precision="4" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="分析结果" prop="analysis_result">
          <el-input v-model="form.analysis_result" type="textarea" :rows="3" placeholder="请输入分析结果" />
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
import { dataAnalysisApi } from '@/api/dataAnalysis'

const loading = ref(false)
const tableData = ref([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  analysis_id: '',
  file_id: '',
  data_source: '',
  data_type: '',
  collection_time: '',
  data_description: '',
  analysis_method: '',
  analyst: '',
  analysis_period: '',
  key_indicator: '',
  indicator_value: 0,
  analysis_result: ''
})

const rules = {
  file_id: [{ required: true, message: '请输入文件ID', trigger: 'blur' }],
  data_source: [{ required: true, message: '请输入数据来源', trigger: 'blur' }],
  data_type: [{ required: true, message: '请输入数据类型', trigger: 'blur' }],
  collection_time: [{ required: true, message: '请选择采集时间', trigger: 'change' }]
}

const formatDateTime = (datetime) => {
  if (!datetime) return '-'
  return datetime.split(' ')[0]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    const res = await dataAnalysisApi.dataAnalysisList(params)
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
    analysis_id: '',
    file_id: '',
    data_source: '',
    data_type: '',
    collection_time: '',
    data_description: '',
    analysis_method: '',
    analyst: '',
    analysis_period: '',
    key_indicator: '',
    indicator_value: 0,
    analysis_result: ''
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
          res = await dataAnalysisApi.dataAnalysisModify(form.value)
        } else {
          res = await dataAnalysisApi.dataAnalysisSubmit(form.value)
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
    `确定要删除分析数据吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await dataAnalysisApi.dataAnalysisDelete({ analysis_id: row.analysis_id })
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
  loadData()
})
</script>

<style scoped>
.data-analysis {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}

.search-bar {
  margin-bottom: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>
