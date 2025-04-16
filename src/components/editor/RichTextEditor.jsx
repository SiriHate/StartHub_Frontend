import React, {useEffect, useRef} from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import styles from './RichTextEditor.module.css';

const RichTextEditor = ({content, setContent}) => {
    const editorRef = useRef(null);
    const quillRef = useRef(null);

    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'video',
        'align', 'color', 'background', 'script',
        'table', 'code-block'
    ];

    const modules = {
        toolbar: [
            // Основное форматирование текста
            ['bold', 'italic', 'underline', 'strike'],
            // Заголовки и размеры
            [{ 'header': [1, 2, 3, false] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            // Цвета и выравнивание
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            // Списки и отступы
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            // Дополнительные элементы
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean']
        ],
        clipboard: {
            matchVisual: false,
        }
    };

    useEffect(() => {
        if (editorRef.current && !quillRef.current) {
            quillRef.current = new Quill(editorRef.current, {
                theme: 'snow',
                modules: modules,
                formats: formats
            });

            quillRef.current.on('text-change', () => {
                setContent(quillRef.current.root.innerHTML);
            });

            quillRef.current.root.innerHTML = content;
        }
    }, [content, setContent]);

    return (
        <div ref={editorRef} className={styles.editor}></div>
    );
};

export default RichTextEditor;
