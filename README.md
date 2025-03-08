# 视频素材管理系统 - API 文档

## 项目概述

视频素材管理系统是一个用于视频关键帧提取、分类和检索的应用。系统可以从上传的视频中自动提取关键帧，利用AI为提取的帧添加标签，并支持通过项目管理和组织这些素材。

### 主要功能

- 视频上传和自动处理
- 关键帧提取
- 通过AI自动标记素材内容
- 支持本地或云端AI图像分类
- 素材标签管理
- 项目管理和素材组织
- 素材搜索和筛选

## API 基础信息

- 基础URL: `/api/v1`
- 所有API返回JSON格式数据

## API 端点

### 素材管理 (`/materials`)

#### 获取素材列表

```
GET /materials?skip=0&limit=100&search=关键词&tag_ids=1,2,3
```

查询参数:
- `skip` (可选): 分页起始位置
- `limit` (可选): 每页数量
- `search` (可选): 搜索关键词
- `tag_ids` (可选): 标签ID列表，用于筛选

响应示例:

```json
[
  {
    "id": 1,
    "source_video": "/path/to/video.mp4",
    "frame_path": "/path/to/frame.jpg",
    "timestamp": 45.5,
    "description": "户外场景",
    "added_date": "2023-11-22T14:30:15",
    "tags": [
      {
        "id": 1,
        "name": "户外",
        "category": "场景",
        "confidence": 0.95
      }
    ]
  }
]
```

#### 获取单个素材

```
GET /materials/{material_id}
```

响应包含素材详细信息，包括标签和所属项目。

#### 获取素材图像

```
GET /materials/{material_id}/image
```

返回素材的图像文件。

#### 更新素材

```
PUT /materials/{material_id}
```

请求体:

```json
{
  "source_video": "/path/to/new_video.mp4",
  "description": "新的描述"
}
```

#### 删除素材

```
DELETE /materials/{material_id}
```

#### 为素材添加标签

```
POST /materials/{material_id}/tags
```

请求体 (标签ID列表):

```json
[1, 2, 3]
```

#### 移除素材标签

```
DELETE /materials/{material_id}/tags/{tag_id}
```

### 标签管理 (`/tags`)

#### 获取标签列表

```
GET /tags?skip=0&limit=100&category=场景
```

查询参数:
- `skip` (可选): 分页起始位置
- `limit` (可选): 每页数量
- `category` (可选): 标签类别

响应示例:

```json
[
  {
    "id": 1,
    "name": "室外",
    "category": "场景",
    "usage_count": 15
  }
]
```

#### 获取标签类别

```
GET /tags/categories
```

返回所有标签类别的列表。

#### 获取单个标签

```
GET /tags/{tag_id}
```

#### 创建标签

```
POST /tags
```

请求体:

```json
{
  "name": "新标签",
  "category": "类别"
}
```

#### 更新标签

```
PUT /tags/{tag_id}
```

请求体:

```json
{
  "name": "更新标签名",
  "category": "新类别"
}
```

#### 删除标签

```
DELETE /tags/{tag_id}
```

#### 合并标签

```
POST /tags/merge
```

请求体:

```json
{
  "source_tag_ids": [2, 3, 4],
  "target_tag_id": 1
}
```

将源标签的所有关联转移至目标标签，并删除源标签。

#### 获取使用标签的素材

```
GET /tags/{tag_id}/materials?skip=0&limit=100
```

### 项目管理 (`/projects`)

#### 获取项目列表

```
GET /projects?skip=0&limit=100
```

响应示例:

```json
[
  {
    "id": 1,
    "name": "宣传片",
    "description": "产品宣传片素材",
    "created_date": "2023-11-20T10:00:00",
    "material_count": 25
  }
]
```

#### 获取单个项目

```
GET /projects/{project_id}
```

#### 创建项目

```
POST /projects
```

请求体:

```json
{
  "name": "新项目",
  "description": "项目描述"
}
```

#### 更新项目

```
PUT /projects/{project_id}
```

请求体:

```json
{
  "name": "更新项目名",
  "description": "新描述"
}
```

#### 删除项目

```
DELETE /projects/{project_id}
```

#### 获取项目素材

```
GET /projects/{project_id}/materials?skip=0&limit=100
```

#### 添加素材至项目

```
POST /projects/{project_id}/materials
```

请求体:

```json
{
  "material_ids": [1, 2, 3],
  "notes": "素材备注"
}
```

#### 从项目移除素材

```
DELETE /projects/{project_id}/materials/{material_id}
```

### 视频处理 (`/processing`)

#### 上传视频

```
POST /processing/upload
```

表单数据:
- `file`: 视频文件
- `extract_only` (可选, 布尔值): 是否仅提取帧而不进行分类

#### 处理已存在的视频

```
POST /processing/process
```

请求体:

```json
{
  "video_path": "/path/to/video.mp4",
  "extract_only": false
}
```

#### 批量处理视频

```
POST /processing/batch
```

表单数据:
- `video_folder`: 包含视频的文件夹路径
- `extract_only` (可选, 布尔值): 是否仅提取帧而不进行分类

## 数据模型

### 素材 (Material)

- `id`: 整数, 主键
- `source_video`: 字符串, 视频源文件路径
- `frame_path`: 字符串, 帧图像文件路径
- `timestamp`: 浮点数, 帧在视频中的时间点
- `description`: 字符串, 可选描述
- `added_date`: 日期时间, 添加时间
- `tags`: 标签列表
- `projects`: 所属项目ID列表

### 标签 (Tag)

- `id`: 整数, 主键
- `name`: 字符串, 标签名称
- `category`: 字符串, 标签类别
- `usage_count`: 整数, 使用此标签的素材数量

### 项目 (Project)

- `id`: 整数, 主键
- `name`: 字符串, 项目名称
- `description`: 字符串, 项目描述
- `created_date`: 日期时间, 创建时间
- `material_count`: 整数, 项目中的素材数量

## 部署与配置

### 环境配置

系统支持通过环境变量或`.env`文件配置:

- `VIDEO_FOLDER`: 视频上传保存路径
- `OUTPUT_FOLDER`: 提取帧保存路径
- `DATABASE_URL`: 数据库连接URL
- `API_TYPE`: 图像分类API类型 (openai, aliyun, huggingface, azure)
- `API_KEY`: API密钥
- `USE_LOCAL_CLASSIFIER`: 是否使用本地分类器 (布尔值)
- `LOCAL_MODEL_PATH`: 本地模型路径
- `LOCAL_MODEL_SIZE`: 本地模型大小 (7b)
- `GPU_LAYERS`: GPU加速的层数
- `MAX_WORKERS`: 并行处理线程数
- `MIN_SCENE_CHANGE_THRESHOLD`: 场景变化检测阈值
- `FRAME_SAMPLE_INTERVAL`: 帧采样间隔
- `QUALITY`: 保存帧的图像质量
- `MAX_FRAMES_PER_VIDEO`: 每个视频的最大提取帧数

### 本地模型配置

使用本地Qwen2-VL模型进行图像分类:

1. 运行 `python app/tools/setup_local_model.py --quant Q4_K_M` 下载模型
2. 在配置中设置 `USE_LOCAL_CLASSIFIER=True` 和相应的 `LOCAL_MODEL_PATH`

### 数据库迁移

系统使用SQLAlchemy ORM，不需要手动创建数据库表。首次启动时会自动创建所需的表结构。

## 使用流程

1. 上传视频或指定已有视频进行处理
2. 系统自动提取关键帧并进行分类
3. 通过API查看和管理素材
4. 创建项目并添加相关素材
5. 使用标签和搜索功能筛选素材

## 技术栈

- FastAPI: Web框架
- SQLAlchemy: ORM数据库操作
- OpenCV: 视频处理和帧提取
- LLM (Qwen2-VL): 本地图像分类
- 云API (可选): 远程图像分类服务

## 开发须知

- 所有接口返回标准HTTP状态码
- 错误会返回具体的错误信息
- 异步操作通过后台任务处理
- 系统会自动为素材分配标签类别