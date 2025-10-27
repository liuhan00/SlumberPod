-- Supabase数据库表设置脚本
-- 在Supabase SQL编辑器中执行这些语句

-- 1. 创建profiles表（用户资料表）
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用行级安全（RLS）
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 创建RLS策略
-- 允许所有用户查看公开资料
CREATE POLICY "任何人都可以查看用户资料" ON public.profiles
    FOR SELECT USING (true);

-- 允许用户更新自己的资料
CREATE POLICY "用户可以更新自己的资料" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 允许用户插入自己的资料
CREATE POLICY "用户可以插入自己的资料" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. 创建触发器自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 使用 ON CONFLICT DO NOTHING 避免因 username/id 唯一约束导致触发器抛出 500
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    ) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. 创建其他可能需要的数据表
-- 睡眠记录表
CREATE TABLE IF NOT EXISTS public.sleep_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;

-- RLS策略
CREATE POLICY "用户可以查看自己的睡眠记录" ON public.sleep_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的睡眠记录" ON public.sleep_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的睡眠记录" ON public.sleep_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的睡眠记录" ON public.sleep_sessions
    FOR DELETE USING (auth.uid() = user_id);