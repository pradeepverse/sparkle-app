import type { Reward, StarRupeeRatio } from '../../types'
import styles from './RewardsScreen.module.css'

interface RewardsScreenProps {
  rewards: Reward[]
  totalStars: number
  redeemTarget: Reward | null
  onRequestRedeem: (reward: Reward) => void
  onConfirmRedeem: (reward: Reward) => void
  onCancelRedeem: () => void
  onBack: () => void
  ratio?: StarRupeeRatio
}

export function RewardsScreen({
  rewards,
  totalStars,
  redeemTarget,
  onRequestRedeem,
  onConfirmRedeem,
  onCancelRedeem,
  onBack,
  ratio,
}: RewardsScreenProps) {
  function formatPrice(starCost: number): string | null {
    if (!ratio || !ratio.stars) return null
    const price = (starCost / ratio.stars) * ratio.rupees
    return `₹${price % 1 === 0 ? price : price.toFixed(2)}`
  }
  return (
    <main className={styles.screen}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back to home">← Home</button>
        <div>
          <h1 className={styles.title}>🏪 Reward Shop</h1>
          <div className={styles.balance} aria-label={`You have ${totalStars} stars`}>
            ⭐ You have <strong>{totalStars}</strong> stars
          </div>
        </div>
      </header>

      {/* ── Reward grid ────────────────────────────────────── */}
      <div className={styles.grid}>
        {rewards.map(reward => {
          const canAfford = totalStars >= reward.starCost
          return (
            <div
              key={reward.id}
              className={[
                styles.card,
                reward.isUnlocked ? styles.cardUnlocked : '',
                !canAfford && !reward.isUnlocked ? styles.cardLocked : '',
              ].join(' ')}
            >
              {reward.thumbnail
                ? <img src={reward.thumbnail} alt={reward.name} className={styles.rewardThumb} />
                : <div className={styles.rewardEmoji}>{reward.emoji}</div>
              }
              <div className={styles.rewardName}>{reward.name}</div>
              <div className={[styles.costBadge, canAfford ? styles.costAfford : ''].join(' ')}>
                ⭐ {reward.starCost}
                {formatPrice(reward.starCost) && (
                  <span className={styles.priceTag}>{formatPrice(reward.starCost)}</span>
                )}
              </div>

              {reward.isUnlocked ? (
                <div className={styles.unlockedBadge}>🎉 Redeemed!</div>
              ) : (
                <button
                  className={styles.redeemBtn}
                  onClick={() => onRequestRedeem(reward)}
                  disabled={!canAfford}
                  aria-label={canAfford ? `Redeem ${reward.name} for ${reward.starCost} stars` : `Need ${reward.starCost - totalStars} more stars for ${reward.name}`}
                >
                  {canAfford ? 'Redeem! ✨' : `Need ${reward.starCost - totalStars} more ⭐`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Confirm dialog ─────────────────────────────────── */}
      {redeemTarget && (
        <div className={styles.dialogOverlay} role="dialog" aria-modal="true" aria-label="Confirm redemption">
          <div className={styles.dialog}>
            {redeemTarget.thumbnail
              ? <img src={redeemTarget.thumbnail} alt={redeemTarget.name} className={styles.dialogThumb} />
              : <div className={styles.dialogEmoji}>{redeemTarget.emoji}</div>
            }
            <div className={styles.dialogTitle}>Spend {redeemTarget.starCost} stars?</div>
            <div className={styles.dialogSub}>{redeemTarget.name}</div>
            <div className={styles.dialogUnicorn}>🦄 Are you sure?</div>
            <div className={styles.dialogBtns}>
              <button className={styles.dialogYes} onClick={() => onConfirmRedeem(redeemTarget)}>
                Yes! 🎉
              </button>
              <button className={styles.dialogNo} onClick={onCancelRedeem}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
