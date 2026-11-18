import { useEffect } from 'react'
import { useTranslate } from '../../i18n/index.js'
import styles from './ImageLightbox.module.css'

/** 图片放大预览：点击遮罩或按 Esc 关闭，可选下载入口。 */
export const ImageLightbox = ({
  url,
  alt,
  downloadUrl,
  onClose,
}: {
  url: string
  alt: string
  downloadUrl?: string
  onClose: () => void
}) => {
  const t = useTranslate()
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <img
        className={styles.lightboxImage}
        src={url}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
      />
      {downloadUrl ? (
        <div className={styles.lightboxActions} onClick={(event) => event.stopPropagation()}>
          <a className={styles.lightboxLink} href={downloadUrl}>
            {t('downloadImage')}
          </a>
        </div>
      ) : null}
    </div>
  )
}
