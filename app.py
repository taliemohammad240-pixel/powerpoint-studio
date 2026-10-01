import streamlit as st

st.set_page_config(
    page_title="PowerPoint Studio",
    page_icon="📊",
    layout="centered"
)

st.title("📊 PowerPoint Studio")
st.write("ساخت پاورپوینت آنلاین")

text = st.text_area(
    "متن پاورپوینت را وارد کنید:",
    height=300,
    placeholder="متن خود را اینجا وارد کنید..."
)

if st.button("🚀 ساخت پاورپوینت"):
    st.success("برنامه آماده است! مرحله بعد ساخت فایل PPTX را اضافه می‌کنیم.")
