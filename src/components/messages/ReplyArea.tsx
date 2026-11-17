import { useTranslate } from '../../i18n/index.js'
import clsx from 'clsx'
import { memo, useEffect, useState, type ReactNode } from 'react'
import {
  IconChevronDownOutline14,
  IconChevronRightOutline14,
  IconThinkOutline16,
} from '../base/icons.js'
import type { AssistantMessage } from '../../services/chat/types.js'
import { getAreaTitle, type ReplyView, type Step } from '../../services/chat/view.js'
import { Markdown } from '../markdown/Markdown.js'
import styles from './ReplyArea.module.css'
import './thinking.markdown.css'

/** 进行中时每秒刷新，用于思考用时展示 */
const useTicker = (active: boolean, interval: number) => {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!active) {
      return
    }
    const timer = setInterval(() => setTick((value) => value + 1), interval)
    return () => clearInterval(timer)
  }, [active, interval])
  return tick
}

/**
 * 思考步骤的时间线：
 * 开启深度思考时带可折叠的标题（正在思考 / 已思考（用时 N 秒））。
 */
export const ReplyArea = memo(function ReplyArea({
  message,
  view,
  streaming,
  hasResponse,
}: {
  message: AssistantMessage
  view: ReplyView
  streaming: boolean
  hasResponse: boolean
}) {
  const t = useTranslate()
  const [open, setOpen] = useState(true)
  const titleActive = streaming && !hasResponse
  useTicker(titleActive, 1000)
  if (view.steps.length === 0 && !(message.thinking && streaming)) {
    return null
  }
  // 未记录请求开关时，按是否有思考内容显示标题。
  const thinking = message.thinking ?? view.steps.some((step) => step.type === 'thinking')
  const title = thinking
    ? getAreaTitle(
        view,
        streaming,
        Date.now(),
        hasResponse,
        (key: string, params?: Record<string, unknown>) => t(key as never, params as never)
      )
    : null
  const stopped = !streaming && !hasResponse
  return (
    <div className={styles.area}>
      {title ? (
        <div className={styles.title} onClick={() => setOpen((value) => !value)}>
          <span className={clsx(styles.titleIcon, stopped && styles.stoppedIcon)}>
            <IconThinkOutline16 />
          </span>
          <span className={clsx(styles.titleText, titleActive && styles.shimmer)}>{title}</span>
          {open ? <IconChevronDownOutline14 /> : <IconChevronRightOutline14 />}
        </div>
      ) : null}
      {open || !title ? (
        <div className={styles.steps}>
          {view.steps.map((step, index) => (
            <StepItem
              key={stepKey(step, index)}
              step={step}
              message={message}
              streaming={streaming}
              isLast={index === view.steps.length - 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
})

const stepKey = (step: Step, index: number) =>
  step.type === 'thinking' ? step.key : `${step.type}-${index}`

const StepItem = ({
  step,
  message,
  streaming,
  isLast,
}: {
  step: Step
  message: AssistantMessage
  streaming: boolean
  isLast: boolean
}) => {
  if (step.type !== 'thinking') {
    return null
  }
  const lastBlock = step.blocks.at(-1)
  const thinking =
    streaming && lastBlock?.startedAt !== undefined && lastBlock.endedAt === undefined
  return (
    <ContentItem isLast={isLast} active={thinking}>
      <Markdown
        content={step.blocks.map((block) => block.thinking).join('')}
        loading={thinking}
        cacheKey={`${message.id}-${step.key}`}
        disableLink
      />
    </ContentItem>
  )
}

/** 思考内容：左侧圆点 + 竖线，小号 markdown */
const ContentItem = ({
  children,
  active,
  isLast,
}: {
  children: ReactNode
  active: boolean
  isLast: boolean
}) => (
  <div className={clsx(styles.content, 'ds-think-content', isLast && styles.lastItem)}>
    <span className={styles.dot}>
      <span className={clsx(styles.dotInner, !active && styles.inactive)} />
    </span>
    {children}
  </div>
)
