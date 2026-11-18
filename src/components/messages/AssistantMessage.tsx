import { useTranslate } from '../../i18n/index.js'
import { memo, useState } from 'react'
import { IconRefreshOutline16, IconWarningOutline16 } from '../base/icons.js'
import { canContinueReply, getReplyText } from '../../services/chat/reply.js'
import { continueReply, regenerateReply } from '../../services/chat/store.js'
import { resolveApiUrl } from '../../services/api/client.js'
import type { AssistantMessage as AssistantMessageType } from '../../services/chat/types.js'
import { IconButton } from '../base/IconButton.js'
import { ImageLightbox } from '../base/ImageLightbox.js'
import { Button } from '../base/Button.js'
import { Markdown } from '../markdown/Markdown.js'
import { CopyButton } from './CopyButton.js'
import { ReplyArea } from './ReplyArea.js'
import { useReplyView } from './useReplyView.js'
import {
  BranchSwitcher,
  type MessageVersions,
  type SelectMessageVersion,
} from './BranchSwitcher.js'
import styles from './AssistantMessage.module.css'

export const AssistantMessage = memo(function AssistantMessage({
  sessionId,
  message,
  isLast,
  streaming,
  busy,
  versions,
  onSelectVersion,
}: {
  sessionId: string
  message: AssistantMessageType
  isLast: boolean
  streaming: boolean
  busy: boolean
  versions: MessageVersions
  onSelectVersion: SelectMessageVersion
}) {
  const t = useTranslate()
  const view = useReplyView(message, streaming)
  const answer = view.answer
  const responseText = answer?.text ?? getReplyText(message)
  const copyText = responseText
  const waiting = streaming && view.steps.length === 0 && !view.answer && !message.thinking
  const images = message.blocks.filter((block) => block.type === 'image')
  const [zoomUrl, setZoomUrl] = useState<string | null>(null)
  return (
    <div className={styles.message}>
      <ReplyArea
        message={message}
        view={view}
        streaming={streaming}
        hasResponse={!!responseText}
      />
      {answer ? (
        <Markdown
          className="ds-assistant-message-main-content"
          content={answer.markdown}
          loading={streaming}
          cacheKey={message.id}
          disableLink={false}
          sources={[]}
        />
      ) : null}
      {images.length > 0 ? (
        <div className={styles.images}>
          {images.map((block, index) =>
            block.type === 'image' ? (
              <img
                key={`${block.image.url}-${index}`}
                src={resolveApiUrl(block.image.url)}
                alt={t('generatedImageAlt')}
                className={styles.generatedImage}
                loading="lazy"
                onClick={() => setZoomUrl(block.image.url)}
              />
            ) : null
          )}
        </div>
      ) : null}
      {zoomUrl ? (
        <ImageLightbox
          url={resolveApiUrl(zoomUrl)}
          alt={t('generatedImageAlt')}
          downloadUrl={`${resolveApiUrl(zoomUrl)}?download=1`}
          onClose={() => setZoomUrl(null)}
        />
      ) : null}
      {waiting ? (
        <div className={styles.waiting}>
          {[0, 1, 2].map((index) => (
            <span key={index} className={styles.waitingDot} />
          ))}
        </div>
      ) : null}
      {message.status === 'stopped' && !message.error && message.stopReason !== 'aborted' ? (
        <div className={styles.notice}>
          <IconWarningOutline16 />
          <span>{t(message.stopReason === 'max_tokens' ? 'replyLengthLimit' : 'replyInterrupted')}</span>
        </div>
      ) : null}
      {message.error ? (
        <div className={styles.notice}>
          <IconWarningOutline16 />
          <span>{message.error.localMessage ? t(message.error.localMessage.key) : message.error.message}</span>
        </div>
      ) : null}
      {streaming ? null : (
        <div className={styles.bottom}>
          <BranchSwitcher versions={versions} disabled={busy} onSelect={onSelectVersion} />
          <div className={styles.actions}>
            {copyText ? <CopyButton text={copyText} /> : null}
            <IconButton
              icon={<IconRefreshOutline16 />}
              tooltip={t('regenerate')}
              tooltipPlacement="bottom"
              disabled={busy}
              onClick={() => {
                regenerateReply(sessionId, message.id)
              }}
            />
          </div>
          {isLast && canContinueReply(message) ? (
            <Button
              variant="outlined"
              size="s"
              className={styles.continueButton}
              disabled={busy}
              onClick={() => {
                continueReply(sessionId, message.id)
              }}
            >
              {t('continueGenerating')}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
})
